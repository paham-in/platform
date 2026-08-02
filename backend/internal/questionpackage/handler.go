package questionpackage

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

// ListPackages mengembalikan daftar paket soal
// @Summary      List question packages
// @Description  Mengembalikan daftar paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} PackageResponse
// @Router       /admin/question-packages [get]
func (h *Handler) ListPackages(c *fiber.Ctx) error {
	packages, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(packages)
}

// GetPackage mengembalikan detail paket soal
// @Summary      Get question package
// @Description  Mengembalikan detail paket soal beserta soalnya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {object} PackageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [get]
func (h *Handler) GetPackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	pkg, err := h.svc.Get(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	return c.JSON(pkg)
}

// CreatePackage membuat paket soal baru
// @Summary      Create question package
// @Description  Membuat paket soal baru
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data paket"
// @Success      201 {object} PackageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages [post]
func (h *Handler) CreatePackage(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	pkg, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(pkg)
}

// UpdatePackage mengubah paket soal
// @Summary      Update question package
// @Description  Mengubah nama, deskripsi, atau soal dalam paket
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Package ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} PackageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [patch]
func (h *Handler) UpdatePackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	pkg, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(pkg)
}

// DeletePackage menghapus paket soal
// @Summary      Delete question package
// @Description  Menghapus paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {object} MessageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [delete]
func (h *Handler) DeletePackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus paket"})
	}
	return c.JSON(MessageResponse{Message: "paket berhasil dihapus"})
}

func Routes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Get("/question-packages", h.ListPackages)
	admin.Get("/question-packages/:id", h.GetPackage)
	admin.Post("/question-packages", h.CreatePackage)
	admin.Patch("/question-packages/:id", h.UpdatePackage)
	admin.Delete("/question-packages/:id", h.DeletePackage)
}
