package main

import (
	"context"
	"log"
	"time"

	"bimbel2/backend/internal/answer"
	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/devreset"
	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/chapter"
	"bimbel2/backend/internal/class"
	"bimbel2/backend/internal/forum"
	"bimbel2/backend/internal/gallery"
	"bimbel2/backend/internal/invoice"
	"bimbel2/backend/internal/tutoring"
	"bimbel2/backend/internal/material"
	"bimbel2/backend/internal/push"
	"bimbel2/backend/internal/questionbank"
	"bimbel2/backend/internal/questionpackage"
	"bimbel2/backend/internal/program"
	"bimbel2/backend/internal/setting"
	"bimbel2/backend/internal/storage"
	"bimbel2/backend/internal/studentclass"
	"bimbel2/backend/internal/subject"
	"bimbel2/backend/internal/upload"
	"bimbel2/backend/internal/user"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberSwagger "github.com/swaggo/fiber-swagger"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	_ "bimbel2/backend/docs"
)

// @title           paham.in API
// @version         1.0
// @description     Platform bimbingan belajar online
// @host            localhost:8080
// @BasePath        /
// @schemes         http
// @securityDefinitions.apikey BearerAuth
// @in              header
// @name            Authorization
func main() {
	cfg := config.Load()

	db := database.Connect(cfg)
	database.Migrate(db)
	seedAdmin(db, cfg)

	// konfigurasi bisnis (fee guru, harga default) tersimpan di DB, admin bisa
	// ubah lewat UI. Env TEACHER_FEE_PERCENT cuma dipakai sekali saat seed.
	settingSvc := setting.NewService(setting.NewRepository(db), cfg.TeacherFeePercent)
	settingSvc.EnsureDefaults()

	minioClient, err := storage.NewMinioClient(cfg)
	if err != nil {
		log.Printf("Warning: MinIO not available: %v", err)
	}

	app := fiber.New(fiber.Config{
		BodyLimit: 6 * 1024 * 1024,
	})
	app.Use(cors.New())
	app.Use(middleware.RequestLogger())

	app.Get("/swagger/*", fiberSwagger.WrapHandler)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "bimbel-backend",
		})
	})

	user.Routes(app, db)
	user.OAuthRoutes(app, db, cfg)
	subject.Routes(app, db)
	forum.Routes(app, db)
	answer.PublicRoutes(app, db)
	push.PublicRoutes(app, db, cfg.VapidPublicKey)
	if minioClient != nil {
		upload.PublicRoutes(app, db, minioClient)
	}

	// Authenticated routes (any role with valid session)
	auth := app.Group("", middleware.SessionRequired(), middleware.SessionResolver(db))
	user.AuthRoutes(auth, db)
	class.PublicRoutes(auth, db)
	chapter.PublicRoutes(auth, db, minioClient)
	material.PublicRoutes(auth, db)
	questionpackage.AuthRoutes(auth, db)
	studentclass.AuthRoutes(auth, db)
		tutoring.Routes(auth, db, minioClient, settingSvc)
	pushSvc := push.NewService(db, cfg.VapidPublicKey, cfg.VapidPrivateKey, cfg.VapidSubject)
	push.Routes(auth, db, cfg.VapidPublicKey, cfg.VapidPrivateKey, cfg.VapidSubject)
	answer.AuthRoutes(auth, db, pushSvc)
	invoice.AuthRoutes(auth, db)
	if minioClient != nil {
		upload.AuthRoutes(auth, db, minioClient)
	}

	// Teacher + admin shared resources (register first so teacher can pass)
	staff := app.Group("/admin", middleware.SessionRequired(), middleware.SessionResolver(db), middleware.RoleAllowed("admin", "teacher"))
	// Resource non-konten — tetap terbuka utk semua teacher.
	class.AdminRoutes(staff, db)
	subject.AdminRoutes(staff, db)
	if minioClient != nil {
		gallery.Routes(staff, db, minioClient)
	}

	// Kelola materi (materi + chapter + cover) — admin selalu, teacher butuh izin.
	content := staff.Group("", middleware.ContentManager("materials"))
	material.AdminRoutes(content, db)
	chapter.AdminRoutes(content, db, minioClient)
	if minioClient != nil {
		chapter.CoverRoutes(content, db, minioClient)
	}

	// Kelola paket soal (paket + soal) — admin selalu, teacher butuh izin.
	packs := staff.Group("", middleware.ContentManager("question_packages"))
	questionpackage.Routes(packs, db)
	questionbank.Routes(packs, db)

	admin := app.Group("/admin", middleware.SessionRequired(), middleware.SessionResolver(db), middleware.RoleAllowed("admin"))
	user.AdminRoutes(admin, db)
	forum.AdminRoutes(admin, db)
	invoice.AdminRoutes(admin, db)
	program.AdminRoutes(admin, db)
	studentclass.AdminRoutes(admin, db)
	setting.AdminRoutes(admin, db, cfg.TeacherFeePercent)
	tutoring.AdminRoutes(admin, db, minioClient, settingSvc)
	devreset.AdminRoutes(admin, db, cfg)

	// background job: hapus sesi yang sudah kedaluwarsa setiap 1 jam
	startSessionCleanup(db)

	// background job: hapus bukti kehadiran approved yang melewati masa simpan
	startEvidenceCleanup(db, minioClient, cfg.EvidenceRetentionDays)

	port := cfg.Port
	log.Printf("Server running on :%s", port)
	log.Fatal(app.Listen(":" + port))
}

func startSessionCleanup(db *gorm.DB) {
	sessionRepo := user.NewSessionRepository(db)
	go func() {
		// jalankan sekali saat boot, lalu berkala
		cleanupExpiredSessions(sessionRepo)
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			cleanupExpiredSessions(sessionRepo)
		}
	}()
}

func cleanupExpiredSessions(repo *user.SessionRepository) {
	deleted, err := repo.DeleteExpired(time.Now())
	if err != nil {
		log.Printf("[session-cleanup] gagal hapus sesi expired: %v", err)
		return
	}
	if deleted > 0 {
		log.Printf("[session-cleanup] %d sesi kedaluwarsa dihapus", deleted)
	}
}

// startEvidenceCleanup menghapus bukti kehadiran approved yang melewati
// masa simpan (retentionDays) dari MinIO. Fire pertama saat tengah malam
// berikutnya, lalu tiap 24 jam.
func startEvidenceCleanup(db *gorm.DB, minioClient *storage.MinioClient, retentionDays int) {
	if minioClient == nil {
		log.Println("[evidence-cleanup] MinIO tidak tersedia — cleanup dilewati")
		return
	}
	repo := tutoring.NewRepository(db)
	go func() {
		now := time.Now()
		next := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, 1)
		time.Sleep(time.Until(next))
		for {
			cleanupApprovedEvidence(repo, minioClient, retentionDays)
			time.Sleep(24 * time.Hour)
		}
	}()
}

func cleanupApprovedEvidence(repo *tutoring.Repository, minioClient *storage.MinioClient, retentionDays int) {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)
	sessions, err := repo.ListApprovedEvidenceOlderThan(cutoff)
	if err != nil {
		log.Printf("[evidence-cleanup] gagal query: %v", err)
		return
	}
	for _, s := range sessions {
		if err := minioClient.Delete(context.Background(), s.EvidenceURL); err != nil {
			log.Printf("[evidence-cleanup] gagal hapus %s: %v", s.EvidenceURL, err)
			continue
		}
		if err := repo.ClearSessionEvidence(s.ID); err != nil {
			log.Printf("[evidence-cleanup] gagal kosongkan evidence sesi %d: %v", s.ID, err)
			continue
		}
		log.Printf("[evidence-cleanup] bukti sesi %d dihapus", s.ID)
	}
}

func ensureAdminRole(db *gorm.DB, user *models.User) {
	var count int64
	db.Model(user).Joins("JOIN user_roles ON user_roles.user_id = users.id").Joins("JOIN roles ON roles.id = user_roles.role_id").Where("roles.name = ?", "admin").Count(&count)
	if count > 0 {
		return
	}
	var adminRole models.Role
	db.Where("name = ?", "admin").First(&adminRole)
	db.Model(user).Association("Roles").Append(&adminRole)
	log.Printf("Admin role assigned to existing user: %s\n", user.Email)
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var existingUser models.User
	if err := db.Where("email = ?", cfg.AdminEmail).First(&existingUser).Error; err == nil {
		ensureAdminRole(db, &existingUser)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPass), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	hashStr := string(hash)
	admin := models.User{
		Name:     cfg.AdminName,
		Email:    cfg.AdminEmail,
		Password: &hashStr,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatal("Failed to seed admin:", err)
	}

	var adminRole models.Role
	db.Where("name = ?", "admin").First(&adminRole)
	db.Model(&admin).Association("Roles").Append(&adminRole)

	log.Printf("Admin seeded: %s / %s\n", cfg.AdminEmail, cfg.AdminPass)
}
