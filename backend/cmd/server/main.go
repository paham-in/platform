package main

import (
	"log"

	"bimbel2/backend/internal/answer"
	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/devreset"
	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/chapter"
	"bimbel2/backend/internal/class"
	"bimbel2/backend/internal/forum"
	"bimbel2/backend/internal/invoice"
	"bimbel2/backend/internal/jobs"
	"bimbel2/backend/internal/notification"
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
	objectStorage, err := storage.NewObjectStorage(cfg)
	if err != nil {
		log.Printf("Warning: storage (rustfs) not available: %v", err)
	}

	// runner untuk background job (cron), bisa juga dipanggil manual lewat devreset.
	jobRunner := jobs.New(db, objectStorage, cfg.EvidenceRetentionDays)

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

	pushSvc := push.NewService(db, cfg.VapidPublicKey, cfg.VapidPrivateKey, cfg.VapidSubject)
	notifRepo := notification.NewRepository(db)
	notifSvc := notification.NewService(notifRepo)
	notifSvc.SetPushService(pushSvc)

	user.Routes(app, db)
	user.OAuthRoutes(app, db, cfg)
	subject.Routes(app, db)
	class.PublicRoutes(app, db)
	forum.Routes(app, db, objectStorage, notifSvc)
	answer.PublicRoutes(app, db, objectStorage)
	push.PublicRoutes(app, db, cfg.VapidPublicKey)

	// Authenticated routes (any role with valid session)
	auth := app.Group("", middleware.SessionRequired(), middleware.SessionResolver(db))
	user.AuthRoutes(auth, db)
	chapter.PublicRoutes(auth, db, objectStorage)
	material.PublicRoutes(auth, db, objectStorage)
	questionpackage.AuthRoutes(auth, db, objectStorage)
	studentclass.AuthRoutes(auth, db, notifSvc)
		tutoring.Routes(auth, db, objectStorage, settingSvc, notifSvc)
	push.Routes(auth, db, cfg.VapidPublicKey, cfg.VapidPrivateKey, cfg.VapidSubject)
	notification.Routes(auth, db)
	answer.AuthRoutes(auth, db, objectStorage, pushSvc, notifSvc)
	invoice.AuthRoutes(auth, db, notifSvc)
	if objectStorage != nil {
		upload.AuthRoutes(auth, objectStorage)
	}

	// Teacher + admin shared resources (register first so teacher can pass)
	staff := app.Group("/admin", middleware.SessionRequired(), middleware.SessionResolver(db), middleware.RoleAllowed("admin", "teacher"))
	// Resource non-konten, tetap terbuka utk semua teacher.
	class.AdminRoutes(staff, db)
	subject.AdminRoutes(staff, db)

	// Kelola materi (materi + chapter + cover), admin selalu, teacher butuh izin.
	content := staff.Group("", middleware.ContentManager(db, "materials"))
	material.AdminRoutes(content, db, objectStorage)
	chapter.AdminRoutes(content, db, objectStorage)
	if objectStorage != nil {
		chapter.CoverRoutes(content, db, objectStorage)
	}

	// Kelola paket soal (paket + soal), admin selalu, teacher butuh izin.
	packs := staff.Group("", middleware.ContentManager(db, "question_packages"))
	questionpackage.Routes(packs, db, objectStorage)
	questionbank.Routes(packs, db, objectStorage)

	admin := app.Group("/admin", middleware.SessionRequired(), middleware.SessionResolver(db), middleware.RoleAllowed("admin"))
	user.AdminRoutes(admin, db)
	forum.AdminRoutes(admin, db, objectStorage)
	invoice.AdminRoutes(admin, db, notifSvc)
	program.AdminRoutes(admin, db)
	studentclass.AdminRoutes(admin, db, notifSvc)
	setting.AdminRoutes(admin, db, cfg.TeacherFeePercent)
	tutoring.AdminRoutes(admin, db, objectStorage, settingSvc, notifSvc)
	devreset.AdminRoutes(admin, db, cfg, jobRunner)

	// background job: hapus sesi kedaluwarsa tiap jam, bukti kehadiran lewat masa
	// simpan, & gambar temp yang ditinggalkan (tiap tengah malam).
	jobRunner.StartSessionCleanup()
	jobRunner.StartEvidenceCleanup()
	jobRunner.StartTempImageCleanup()
	jobRunner.StartNotificationCleanup()

	port := cfg.Port
	log.Printf("Server running on :%s", port)
	log.Fatal(app.Listen(":" + port))
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
