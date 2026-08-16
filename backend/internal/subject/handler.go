package subject

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ListSubjects mengembalikan daftar semua mata pelajaran
// @Summary      List subjects
// @Description  Mengembalikan daftar semua mata pelajaran, bisa difilter search & class_id
// @Tags         Subjects
// @Accept       json
// @Produce      json
// @Param        search query string false "Search by name"
// @Param        class_id query int false "Filter by class ID"
// @Success      200 {array} ListSubjectsResponse
// @Router       /subjects [get]
func (h *Handler) ListSubjects(c *fiber.Ctx) error {
	search := c.Query("search", "")
	var classID uint
	if v := c.Query("class_id"); v != "" {
		id, err := strconv.ParseUint(v, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "class_id tidak valid"})
		}
		classID = uint(id)
	}
	subjects, err := h.svc.List(search, classID)
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
// @Param        body body AdminCreateSubjectRequest true "Data subject"
// @Success      201 {object} AdminCreateSubjectResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/subjects [post]
func (h *Handler) AdminCreateSubject(c *fiber.Ctx) error {
	var input AdminCreateSubjectRequest
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "nama wajib diisi"})
	}

	subject, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
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
// @Param        body body AdminUpdateSubjectRequest true "Data update"
// @Success      200 {object} AdminUpdateSubjectResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/subjects/{id} [patch]
func (h *Handler) AdminUpdateSubject(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input AdminUpdateSubjectRequest
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	subject, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
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
// @Success      200 {object} AdminDeleteSubjectResponse
// @Router       /admin/subjects/{id} [delete]
func (h *Handler) AdminDeleteSubject(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus data"})
	}
	return c.JSON(AdminDeleteSubjectResponse{Message: "berhasil dihapus"})
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
