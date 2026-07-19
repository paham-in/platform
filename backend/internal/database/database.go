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
	db.AutoMigrate(&models.User{}, &models.Session{}, &models.Class{}, &models.Subject{}, &models.ClassSubject{}, &models.Chapter{}, &models.Material{}, &models.Question{}, &models.Answer{}, &models.QuestionImage{})

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

	log.Println("Migration completed")
}
