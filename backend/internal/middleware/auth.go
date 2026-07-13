package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
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

func RoleAllowed(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}
