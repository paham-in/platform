package program

import (
	"strconv"

	"bimbel2/backend/internal/models"

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

// AdminListPrograms mengembalikan daftar semua program
// @Summary      List programs
// @Description  Mengembalikan daftar program beserta kelasnya
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} ProgramResponse
// @Router       /admin/programs [get]
func (h *Handler) AdminListPrograms(c *fiber.Ctx) error {
	programs, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(programs)
}

// AdminGetProgram mengembalikan detail program
// @Summary      Get program
// @Description  Mengembalikan detail program beserta kelasnya
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Program ID"
// @Success      200 {object} ProgramResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/programs/{id} [get]
func (h *Handler) AdminGetProgram(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	p, err := h.svc.Get(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "program tidak ditemukan"})
	}
	return c.JSON(p)
}

// AdminCreateProgram membuat program baru
// @Summary      Create program
// @Description  Membuat program baru
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data program"
// @Success      201 {object} ProgramResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/programs [post]
func (h *Handler) AdminCreateProgram(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	p, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(p)
}

// AdminUpdateProgram mengubah program
// @Summary      Update program
// @Description  Mengubah program
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int      true "Program ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} ProgramResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/programs/{id} [patch]
func (h *Handler) AdminUpdateProgram(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	p, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(p)
}

// AdminDeleteProgram menghapus program
// @Summary      Delete program
// @Description  Menghapus program (kelas akan dilepas)
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Program ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/programs/{id} [delete]
func (h *Handler) AdminDeleteProgram(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	// lepas dulu semua kelas dari program ini (foreign key program_id nullable)
	h.svc.db.Model(&models.Class{}).Where("program_id = ?", uint(id)).Update("program_id", nil)
	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus program"})
	}
	return c.JSON(MessageResponse{Message: "program berhasil dihapus"})
}

// AdminAssignClass mengaitkan kelas ke program
// @Summary      Assign class to program
// @Description  Menautkan kelas ke program
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int true "Program ID"
// @Param        body body object true "Data: class_id"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/programs/{id}/classes [post]
func (h *Handler) AdminAssignClass(c *fiber.Ctx) error {
	pid, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id program tidak valid"})
	}
	var input struct {
		ClassID uint `json:"class_id"`
	}
	if err := c.BodyParser(&input); err != nil || input.ClassID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "class_id wajib diisi"})
	}
	if err := h.svc.AssignClass(uint(pid), input.ClassID); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengaitkan kelas"})
	}
	return c.JSON(MessageResponse{Message: "kelas berhasil dikaitkan"})
}

// AdminUnassignClass melepas kelas dari program
// @Summary      Unassign class from program
// @Tags         Program
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        class_id path int true "Class ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/programs/classes/{class_id} [delete]
func (h *Handler) AdminUnassignClass(c *fiber.Ctx) error {
	cid, err := strconv.ParseUint(c.Params("class_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id kelas tidak valid"})
	}
	if err := h.svc.UnassignClass(uint(cid)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal melepas kelas"})
	}
	return c.JSON(MessageResponse{Message: "kelas berhasil dilepas"})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	admin.Get("/programs", h.AdminListPrograms)
	admin.Get("/programs/:id", h.AdminGetProgram)
	admin.Post("/programs", h.AdminCreateProgram)
	admin.Patch("/programs/:id", h.AdminUpdateProgram)
	admin.Delete("/programs/:id", h.AdminDeleteProgram)
	admin.Post("/programs/:id/classes", h.AdminAssignClass)
	admin.Delete("/programs/classes/:class_id", h.AdminUnassignClass)
}
