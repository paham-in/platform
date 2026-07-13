package main

import (
	"log"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/user"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	cfg := config.Load()

	db := database.Connect(cfg)
	database.Migrate(db)

	app := fiber.New()
	app.Use(cors.New())

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
