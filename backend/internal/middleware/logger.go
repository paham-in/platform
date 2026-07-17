package middleware

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		dur := time.Since(start)

		log.Printf("[%s] %s %s %d %s",
			c.IP(),
			c.Method(),
			c.Path(),
			c.Response().StatusCode(),
			dur,
		)
		return err
	}
}
