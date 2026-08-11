package chapter

import (
	"strconv"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/storage"

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
	db  *gorm.DB
}

func NewHandler(svc *Service, db *gorm.DB) *Handler {
	return &Handler{svc: svc, db: db}
}

// AdminListChapters mengembalikan daftar semua chapter (admin only)
// @Summary      List chapters
// @Description  Mengembalikan daftar semua chapter, bisa difilter dengan class_id & subject_id
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        class_id query int false "Filter by class ID"
// @Param        subject_id query int false "Filter by subject ID"
// @Success      200 {array} ChapterResponse
// @Router       /admin/chapters [get]
func (h *Handler) AdminListChapters(c *fiber.Ctx) error {
	classIDStr := c.Query("class_id")
	subjectIDStr := c.Query("subject_id")

	if classIDStr != "" && subjectIDStr != "" {
		classID, err := strconv.ParseUint(classIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "class_id tidak valid"})
		}
		subjectID, err := strconv.ParseUint(subjectIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "subject_id tidak valid"})
		}
		chapters, err := h.svc.ListByClassSubject(uint(classID), uint(subjectID))
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(chapters)
	}

	chapters, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(chapters)
}

// AdminGetChapter mengembalikan detail satu chapter (untuk resolve subject)
// @Summary      Get chapter
// @Description  Mengembalikan detail chapter berdasarkan ID
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Chapter ID"
// @Success      200 {object} ChapterResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/chapters/{id} [get]
func (h *Handler) AdminGetChapter(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	chapter, err := h.svc.Get(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "chapter tidak ditemukan"})
	}
	return c.JSON(chapter)
}

// AdminCreateChapter menambah chapter baru (admin only)
// @Summary      Create chapter
// @Description  Menambah chapter baru
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data chapter"
// @Success      201 {object} ChapterResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/chapters [post]
func (h *Handler) AdminCreateChapter(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Title == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "title wajib diisi"})
	}
	if input.ClassID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "class_id wajib diisi"})
	}
	if input.SubjectID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "subject_id wajib diisi"})
	}

	chapter, err := h.svc.Create(input)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan data"})
	}
	return c.Status(201).JSON(chapter)
}

// AdminUpdateChapter mengubah chapter (admin only)
// @Summary      Update chapter
// @Description  Mengubah chapter
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int    true "Chapter ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} ChapterResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/chapters/{id} [patch]
func (h *Handler) AdminUpdateChapter(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	chapter, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengupdate data"})
	}
	return c.JSON(chapter)
}

// AdminDeleteChapter menghapus chapter (admin only)
// @Summary      Delete chapter
// @Description  Menghapus chapter
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Chapter ID"
// @Success      200 {object} MessageResponse
// @Router       /admin/chapters/{id} [delete]
func (h *Handler) AdminDeleteChapter(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus data"})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	admin.Get("/chapters", h.AdminListChapters)
	admin.Get("/chapters/:id", h.AdminGetChapter)
	admin.Post("/chapters", h.AdminCreateChapter)
	admin.Patch("/chapters/:id", h.AdminUpdateChapter)
	admin.Delete("/chapters/:id", h.AdminDeleteChapter)
}

// ListChapters mengembalikan daftar chapter (memerlukan login)
// @Summary      List chapters
// @Description  Mengembalikan daftar chapter. Student hanya melihat chapter
// kelas yang dia langganan; user lain (admin/teacher/user) melihat semua.
// @Tags         Chapters
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        class_id query int false "Filter by class ID"
// @Param        subject_id query int false "Filter by subject ID"
// @Success      200 {array} ChapterResponse
// @Router       /chapters [get]
func (h *Handler) ListChapters(c *fiber.Ctx) error {
	// student → hanya kelas dengan StudentClass aktif; lainnya semua kelas
	var classIDs []uint
	roles, ok := c.Locals("roles").([]string)
	if ok {
		for _, r := range roles {
			if r == "student" {
				classIDs = middleware.AccessibleClassIDs(c, h.db)
				break
			}
		}
	}

	classIDStr := c.Query("class_id")
	subjectIDStr := c.Query("subject_id")
	if classIDStr != "" && subjectIDStr != "" {
		classID, err := strconv.ParseUint(classIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "class_id tidak valid"})
		}
		subjectID, err := strconv.ParseUint(subjectIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "subject_id tidak valid"})
		}
		chapters, err := h.svc.ListByClassSubjectScoped(uint(classID), uint(subjectID), classIDs)
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(chapters)
	}

	chapters, err := h.svc.ListScoped(classIDs)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(chapters)
}

func PublicRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	app.Get("/chapters", h.ListChapters)
}
