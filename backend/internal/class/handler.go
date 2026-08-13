package class

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// AdminListClasses mengembalikan daftar semua kelas
// @Summary      List classes
// @Description  Mengembalikan daftar semua kelas
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} ClassResponse
// @Router       /admin/classes [get]
func (h *Handler) AdminListClasses(c *fiber.Ctx) error {
	classes, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(classes)
}

// AdminCreateClass menambah kelas baru
// @Summary      Create class
// @Description  Menambah kelas baru
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Data kelas"
// @Success      201 {object} ClassResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/classes [post]
func (h *Handler) AdminCreateClass(c *fiber.Ctx) error {
	var input struct {
		Name             string  `json:"name"`
		PricePerSession  float64 `json:"price_per_session"`
		GroupPrice       float64 `json:"group_price"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "nama wajib diisi"})
	}

	class, err := h.svc.Create(input.Name, input.PricePerSession, input.GroupPrice)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan data"})
	}
	return c.Status(201).JSON(class)
}

// AdminUpdateClass mengubah kelas
// @Summary      Update class
// @Description  Mengubah kelas
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int    true "Class ID"
// @Param        body body object true "Data update"
// @Success      200 {object} ClassResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/classes/{id} [patch]
func (h *Handler) AdminUpdateClass(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input struct {
		Name             string   `json:"name"`
		PricePerSession  *float64 `json:"price_per_session"`
		GroupPrice       *float64 `json:"group_price"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	class, err := h.svc.Update(uint(id), input.Name, input.PricePerSession, input.GroupPrice)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengupdate data"})
	}
	return c.JSON(class)
}

// AdminDeleteClass menghapus kelas
// @Summary      Delete class
// @Description  Menghapus kelas
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Class ID"
// @Success      200 {object} MessageResponse
// @Router       /admin/classes/{id} [delete]
func (h *Handler) AdminDeleteClass(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus data"})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Get("/classes", h.AdminListClasses)
	admin.Post("/classes", h.AdminCreateClass)
	admin.Patch("/classes/:id", h.AdminUpdateClass)
	admin.Delete("/classes/:id", h.AdminDeleteClass)
}

// ListClasses mengembalikan daftar kelas (memerlukan login)
// @Summary      List classes
// @Description  Mengembalikan daftar semua kelas untuk user yang sudah login
// @Tags         Classes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} ClassResponse
// @Router       /classes [get]
func (h *Handler) ListClasses(c *fiber.Ctx) error {
	return h.AdminListClasses(c)
}

func PublicRoutes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	app.Get("/classes", h.ListClasses)
}
