package subject

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

// MessageResponse represents a success message
type MessageResponse struct {
	Message string `json:"message" example:"berhasil"`
}

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ListSubjects mengembalikan daftar semua mata pelajaran
// @Summary      List subjects
// @Description  Mengembalikan daftar semua mata pelajaran
// @Tags         Subjects
// @Accept       json
// @Produce      json
// @Success      200 {array} SubjectResponse
// @Router       /subjects [get]
func (h *Handler) ListSubjects(c *fiber.Ctx) error {
	subjects, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(subjects)
}

// AdminCreateSubject menambah mata pelajaran (admin only)
// @Summary      Create subject
// @Description  Menambah mata pelajaran baru (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Data subject"
// @Success      201 {object} SubjectResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/subjects [post]
func (h *Handler) AdminCreateSubject(c *fiber.Ctx) error {
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "nama wajib diisi"})
	}

	subject, err := h.svc.Create(input.Name, input.Description)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan data"})
	}
	return c.Status(201).JSON(subject)
}

// AdminUpdateSubject mengubah mata pelajaran (admin only)
// @Summary      Update subject
// @Description  Mengubah mata pelajaran (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int    true "Subject ID"
// @Param        body body object true "Data update"
// @Success      200 {object} SubjectResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/subjects/{id} [patch]
func (h *Handler) AdminUpdateSubject(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	subject, err := h.svc.Update(uint(id), input.Name, input.Description)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengupdate data"})
	}
	return c.JSON(subject)
}

// AdminDeleteSubject menghapus mata pelajaran (admin only)
// @Summary      Delete subject
// @Description  Menghapus mata pelajaran (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Subject ID"
// @Success      200 {object} MessageResponse
// @Router       /admin/subjects/{id} [delete]
func (h *Handler) AdminDeleteSubject(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus data"})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func Routes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	app.Get("/subjects", h.ListSubjects)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Post("/subjects", h.AdminCreateSubject)
	admin.Patch("/subjects/:id", h.AdminUpdateSubject)
	admin.Delete("/subjects/:id", h.AdminDeleteSubject)
}
