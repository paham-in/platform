package middleware

import (
	"time"

	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// CanAccessPremium true kalau user boleh akses konten premium:
// admin/teacher otomatis; student butuh ≥1 StudentProgram aktif (Expiry >= today).
func CanAccessPremium(c *fiber.Ctx, db *gorm.DB) bool {
	roles, ok := c.Locals("roles").([]string)
	if !ok {
		return false
	}
	for _, r := range roles {
		if r == "admin" || r == "teacher" {
			return true
		}
	}
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return false
	}
	today := time.Now().Format("2006-01-02")
	var n int64
	if err := db.Model(&models.StudentProgram{}).
		Where("user_id = ? AND expiry >= ?", userID, today).
		Count(&n).Error; err != nil {
		return false
	}
	return n > 0
}
