package database

import (
	"fmt"
	"log"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected")
	return db
}

func Migrate(db *gorm.DB) {
	// AutoMigrate. Urutan tabel penting: GORM men-generate FK constraint inline
	// di CREATE TABLE, jadi model yang ber-FK ke tabel lain harus muncul SETELAH
	// tabel yang direferensikan. Urutan di sini disusun mengikuti dependensi FK
	// (dulu Invoice sebelum Booking → `fk_bookings_invoice` mereferensikan
	// `bookings` yang belum dibuat → AutoMigrate gagal berhenti di tengah dan
	// tabel sisanya tidak pernah dibuat).
	if err := db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Role{},
		&models.Program{},
		&models.Class{},
		&models.Subject{},
		&models.ClassSubject{},
		&models.Chapter{},
		&models.Material{},
		&models.MaterialAsset{},
		&models.ForumQuestion{},
		&models.ForumAnswer{},
		&models.ForumQuestionAsset{},
		&models.ForumAnswerAsset{},
		&models.Booking{},
		&models.Invoice{},
		&models.TutoringSession{},
		&models.QuizCollection{},
		&models.QuizPackage{},
		&models.QuizQuestion{},
		&models.QuizAnswer{},
		&models.QuizQuestionAsset{},
		&models.QuizAnswerAsset{},
		&models.QuizStudentProgress{},
		&models.TeacherSubject{},
		&models.StudentClassEnrollment{},
		&models.PushSubscription{},
		&models.Notification{},
		&models.TeacherPermission{},
		&models.Setting{},
	); err != nil {
		log.Fatalf("AutoMigrate gagal, DB tidak dapat dipakai: %v", err)
	}

	// seed default roles
	for _, name := range []string{"student", "teacher", "admin"} {
		var role models.Role
		if err := db.Where("name = ?", name).First(&role).Error; err != nil {
			db.Create(&models.Role{Name: name})
		}
	}

	// hapus role "user" (legacy, semua pendaftar kini otomatis student) dari semua pemilik.
	var userRole models.Role
	if err := db.Where("name = ?", "user").First(&userRole).Error; err == nil {
		db.Exec("DELETE FROM user_roles WHERE role_id = ?", userRole.ID)
		db.Delete(&userRole)
		log.Println("Removed role 'user' from database")
	}

	// user tanpa role → assign student.
	var roleless []models.User
	db.Preload("Roles").Where("id NOT IN (SELECT user_id FROM user_roles)").Find(&roleless)
	if len(roleless) > 0 {
		var studentRole models.Role
		db.Where("name = ?", "student").First(&studentRole)
		for i := range roleless {
			db.Model(&roleless[i]).Association("Roles").Append(&studentRole)
		}
		log.Printf("Assigned default role to %d existing users\n", len(roleless))
	}

	log.Println("Migration completed")
}
