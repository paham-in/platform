package middleware

import (
	"strings"
	"time"

	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SessionRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}
		c.Locals("token", strings.TrimPrefix(auth, "Bearer "))
		return c.Next()
	}
}

func SessionResolver(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token, ok := c.Locals("token").(string)
		if !ok || token == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}
		var session models.Session
		if err := db.Where("token = ? AND expires_at > ?", token, time.Now().Unix()).First(&session).Error; err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "session tidak valid atau expired"})
		}
		var user models.User
		if err := db.First(&user, session.UserID).Error; err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "user tidak ditemukan"})
		}
		c.Locals("user_id", user.ID)
		c.Locals("role", user.Role)
		c.Locals("user", &user)
		return c.Next()
	}
}

func OptionalSessionResolver(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			return c.Next()
		}
		token := strings.TrimPrefix(auth, "Bearer ")
		var session models.Session
		if err := db.Where("token = ? AND expires_at > ?", token, time.Now().Unix()).First(&session).Error; err != nil {
			return c.Next()
		}
		var user models.User
		if err := db.First(&user, session.UserID).Error; err != nil {
			return c.Next()
		}
		c.Locals("user_id", user.ID)
		c.Locals("role", user.Role)
		c.Locals("user", &user)
		return c.Next()
	}
}

func RoleAllowed(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
		}
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}
