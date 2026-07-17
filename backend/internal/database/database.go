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
	db.AutoMigrate(&models.User{}, &models.Session{}, &models.Class{}, &models.Subject{}, &models.ClassSubject{}, &models.Chapter{}, &models.Material{})

	// migrate existing chapters table — add class_id column
	if !db.Migrator().HasColumn(&models.Chapter{}, "class_id") {
		db.Exec("ALTER TABLE chapters ADD COLUMN class_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_chapters_class_id ON chapters(class_id)")
	}

	// migrate unique index — from slug-only to composite (class_id, subject_id, slug)
	if db.Migrator().HasIndex(&models.Chapter{}, "idx_chapters_slug") {
		db.Migrator().DropIndex(&models.Chapter{}, "idx_chapters_slug")
	}

	// hard-delete soft-deleted rows to avoid slug unique constraint conflicts
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Chapter{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Subject{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Material{})

	log.Println("Migration completed")
}
