package middleware

import (
	"strings"
	"time"

	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func extractRoles(db *gorm.DB, userID uint) []string {
	var user models.User
	if err := db.Preload("Roles").First(&user, userID).Error; err != nil {
		return nil
	}
	roles := make([]string, len(user.Roles))
	for i, r := range user.Roles {
		roles[i] = r.Name
	}
	return roles
}

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
		if err := db.Preload("Roles").First(&user, session.UserID).Error; err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "user tidak ditemukan"})
		}
		c.Locals("user_id", user.ID)
		c.Locals("roles", extractRoles(db, user.ID))
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
		if err := db.Preload("Roles").First(&user, session.UserID).Error; err != nil {
			return c.Next()
		}
		c.Locals("user_id", user.ID)
		c.Locals("roles", extractRoles(db, user.ID))
		c.Locals("user", &user)
		return c.Next()
	}
}

func RoleAllowed(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoles, ok := c.Locals("roles").([]string)
		if !ok {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
		}
		for _, ur := range userRoles {
			for _, ar := range allowedRoles {
				if ur == ar {
					return c.Next()
				}
			}
		}
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}
