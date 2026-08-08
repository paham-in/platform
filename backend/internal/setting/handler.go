package setting

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetSettings mengambil semua konfigurasi aplikasi (admin only)
// @Summary      Get app settings
// @Description  Mengambil semua konfigurasi aplikasi (admin only)
// @Tags         Admin
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]string
// @Router       /admin/settings [get]
func (h *Handler) GetSettings(c *fiber.Ctx) error {
	m, err := h.svc.GetMap()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(m)
}

// UpdateSettings menyimpan konfigurasi aplikasi (admin only)
// @Summary      Update app settings
// @Description  Menyimpan konfigurasi aplikasi (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body map[string]string true "Data settings"
// @Success      200 {object} map[string]string
// @Failure      400 {object} ErrorResponse
// @Router       /admin/settings [patch]
func (h *Handler) UpdateSettings(c *fiber.Ctx) error {
	var input map[string]string
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if len(input) == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "tidak ada data dikirim"})
	}
	if err := h.svc.Update(input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	m, err := h.svc.GetMap()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(m)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, envFeePercent float64) {
	repo := NewRepository(db)
	svc := NewService(repo, envFeePercent)
	h := NewHandler(svc)

	admin.Get("/settings", h.GetSettings)
	admin.Patch("/settings", h.UpdateSettings)
}
