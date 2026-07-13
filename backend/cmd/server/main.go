package main

import (
	"log"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/models"
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

	app := fiber.New()
	app.Use(cors.New())

	app.Get("/swagger/*", fiberSwagger.WrapHandler)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "bimbel-backend",
		})
	})

	user.Routes(app, db)

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

	admin := models.User{
		Name:     cfg.AdminName,
		Email:    cfg.AdminEmail,
		Password: string(hash),
		Role:     "admin",
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatal("Failed to seed admin:", err)
	}

	log.Printf("Admin seeded: %s / %s\n", cfg.AdminEmail, cfg.AdminPass)
}
