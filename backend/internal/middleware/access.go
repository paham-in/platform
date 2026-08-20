package middleware

import (
	"time"

	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// AccessibleClassIDs mengembalikan class_id yang boleh diakses user.
// admin/teacher → nil (semua kelas); student → daftar kelas dengan StudentClass aktif.
func AccessibleClassIDs(c *fiber.Ctx, db *gorm.DB) []uint {
	roles, ok := c.Locals("roles").([]string)
	if !ok {
		return nil
	}
	for _, r := range roles {
		if r == "admin" || r == "teacher" {
			return nil
		}
	}
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return nil
	}
	today := time.Now().Format("2006-01-02")
	var ids []uint
	if err := db.Model(&models.StudentClassEnrollment{}).
		Where("user_id = ? AND expiry >= ?", userID, today).
		Distinct("class_id").Pluck("class_id", &ids).Error; err != nil {
		return nil
	}
	return ids
}

// CanAccessClass true kalau user boleh akses konten premium kelas tertentu.
// admin/teacher otomatis; student butuh StudentClass aktif utk kelas itu.
func CanAccessClass(c *fiber.Ctx, db *gorm.DB, classID uint) bool {
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
	if err := db.Model(&models.StudentClassEnrollment{}).
		Where("user_id = ? AND class_id = ? AND expiry >= ?", userID, classID, today).
		Count(&n).Error; err != nil {
		return false
	}
	return n > 0
}

// CanAccessPremium true kalau user punya akses premium global
// (admin/teacher otomatis; student butuh ≥1 StudentClass aktif).
// Dipakai utk konten yang tidak terikat kelas, mis. paket soal.
func CanAccessPremium(c *fiber.Ctx, db *gorm.DB) bool {
	roles, ok := c.Locals("roles").([]string)
	if ok {
		for _, r := range roles {
			if r == "admin" || r == "teacher" {
				return true
			}
		}
	}
	return len(AccessibleClassIDs(c, db)) > 0
}
