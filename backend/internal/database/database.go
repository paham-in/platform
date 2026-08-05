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
	// clean up orphaned subject_images before AutoMigrate (FK constraint)
	db.Exec("DELETE FROM subject_images WHERE user_id NOT IN (SELECT id FROM users)")

	db.AutoMigrate(&models.User{}, &models.Session{}, &models.Class{}, &models.Subject{}, &models.ClassSubject{}, &models.Chapter{}, &models.Material{}, &models.Question{}, &models.Answer{}, &models.QuestionImage{}, &models.SubjectImage{}, &models.Invoice{}, &models.Availability{}, &models.Booking{}, &models.Role{}, &models.QuestionBank{}, &models.QuestionbankAnswer{}, &models.QuestionPackage{}, &models.TeacherSubject{})

	// seed default roles
	for _, name := range []string{"student", "teacher", "admin"} {
		var role models.Role
		if err := db.Where("name = ?", name).First(&role).Error; err != nil {
			db.Create(&models.Role{Name: name})
		}
	}

	// migrate existing users without roles — assign student as default
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

	// migrate existing chapters table -- add class_id column
	if !db.Migrator().HasColumn(&models.Chapter{}, "class_id") {
		db.Exec("ALTER TABLE chapters ADD COLUMN class_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_chapters_class_id ON chapters(class_id)")
	}

	// migrate unique index -- from slug-only to composite (class_id, subject_id, slug)
	if db.Migrator().HasIndex(&models.Chapter{}, "idx_chapters_slug") {
		db.Migrator().DropIndex(&models.Chapter{}, "idx_chapters_slug")
	}

	// hard-delete soft-deleted rows to avoid slug unique constraint conflicts
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Chapter{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Subject{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Material{})

	// migrate existing materials table -- add chapter_id, fix old subject_id
	if !db.Migrator().HasColumn(&models.Material{}, "chapter_id") {
		db.Exec("ALTER TABLE materials ADD COLUMN chapter_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_materials_chapter_id ON materials(chapter_id)")
	}
	if db.Migrator().HasColumn(&models.Material{}, "subject_id") {
		db.Exec("ALTER TABLE materials DROP COLUMN subject_id")
	}
	if !db.Migrator().HasColumn(&models.Material{}, "author_id") {
		db.Exec("ALTER TABLE materials ADD COLUMN author_id BIGINT NOT NULL DEFAULT 0")
	}

	// migrate existing users -- add payment_status
	if !db.Migrator().HasColumn(&models.User{}, "payment_status") {
		db.Exec("ALTER TABLE users ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'")
	}

	// migrate questions -- drop title, add plain_content
	if db.Migrator().HasColumn(&models.Question{}, "title") {
		db.Exec("ALTER TABLE questions DROP COLUMN title")
	}
	if !db.Migrator().HasColumn(&models.Question{}, "plain_content") {
		db.Exec("ALTER TABLE questions ADD COLUMN plain_content TEXT NOT NULL DEFAULT ''")
	}

	// migrate questions -- drop upvotes
	if db.Migrator().HasColumn(&models.Question{}, "upvotes") {
		db.Exec("ALTER TABLE questions DROP COLUMN upvotes")
	}

	// migrate question_images -- drop url column
	if db.Migrator().HasColumn(&models.QuestionImage{}, "url") {
		db.Exec("ALTER TABLE question_images DROP COLUMN url")
	}

	// migrate subject_images -- add user_id column
	if !db.Migrator().HasColumn(&models.SubjectImage{}, "user_id") {
		db.Exec("ALTER TABLE subject_images ADD COLUMN user_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_subject_images_user_id ON subject_images(user_id)")
	}

	// migrate classes -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Class{}, "description") {
		db.Exec("ALTER TABLE classes DROP COLUMN description")
	}

	// migrate subjects -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Subject{}, "description") {
		db.Exec("ALTER TABLE subjects DROP COLUMN description")
	}

	log.Println("Migration completed")
}
