package main

import (
	"log"

	"bimbel2/backend/internal/answer"
	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/chapter"
	"bimbel2/backend/internal/class"
	"bimbel2/backend/internal/forum"
	"bimbel2/backend/internal/material"
	"bimbel2/backend/internal/storage"
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

// @title           Bimbel API
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

	minioClient, err := storage.NewMinioClient(cfg)
	if err != nil {
		log.Printf("Warning: MinIO not available: %v", err)
	}

	app := fiber.New()
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
	if minioClient != nil {
		upload.PublicRoutes(app, db, minioClient)
	}

	// Authenticated routes (any role with valid session)
	auth := app.Group("", middleware.SessionRequired(), middleware.SessionResolver(db))
	user.AuthRoutes(auth, db)
	class.PublicRoutes(auth, db)
	chapter.PublicRoutes(auth, db)
	material.PublicRoutes(auth, db)
	answer.AuthRoutes(auth, db)
	if minioClient != nil {
		upload.AuthRoutes(auth, db, minioClient)
	}

	admin := app.Group("/admin", middleware.SessionRequired(), middleware.SessionResolver(db), middleware.RoleAllowed("admin"))
	user.AdminRoutes(admin, db)
	class.AdminRoutes(admin, db)
	chapter.AdminRoutes(admin, db)
	subject.AdminRoutes(admin, db)
	material.AdminRoutes(admin, db)
	forum.AdminRoutes(admin, db)

	port := cfg.Port
	log.Printf("Server running on :%s", port)
	log.Fatal(app.Listen(":" + port))
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
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
		Role:     "admin",
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatal("Failed to seed admin:", err)
	}

	log.Printf("Admin seeded: %s / %s\n", cfg.AdminEmail, cfg.AdminPass)
}
