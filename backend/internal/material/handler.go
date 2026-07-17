package material

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

// AdminListMaterials mengembalikan daftar semua materi (admin only)
// @Summary      List materials
// @Description  Mengembalikan daftar semua materi, bisa difilter dengan subject_id
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id query int false "Filter by subject ID"
// @Success      200 {array} MaterialResponse
// @Router       /admin/materials [get]
func (h *Handler) AdminListMaterials(c *fiber.Ctx) error {
	if subjectIDStr := c.Query("subject_id"); subjectIDStr != "" {
		subjectID, err := strconv.ParseUint(subjectIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "subject_id tidak valid"})
		}
		materials, err := h.svc.ListBySubject(uint(subjectID))
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(materials)
	}

	materials, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(materials)
}

// AdminGetMaterial mengambil detail materi (admin only)
// @Summary      Get material
// @Description  Mengambil detail materi berdasarkan ID
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Material ID"
// @Success      200 {object} MaterialResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/materials/{id} [get]
func (h *Handler) AdminGetMaterial(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	material, err := h.svc.Get(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "materi tidak ditemukan"})
	}
	return c.JSON(material)
}

// AdminCreateMaterial menambah materi baru (admin only)
// @Summary      Create material
// @Description  Menambah materi baru
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data materi"
// @Success      201 {object} MaterialResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/materials [post]
func (h *Handler) AdminCreateMaterial(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Title == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "title wajib diisi"})
	}
	if input.SubjectID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "subject_id wajib diisi"})
	}

	material, err := h.svc.Create(input)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan data"})
	}
	return c.Status(201).JSON(material)
}

// AdminUpdateMaterial mengubah materi (admin only)
// @Summary      Update material
// @Description  Mengubah materi berdasarkan ID
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int      true "Material ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} MaterialResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/materials/{id} [patch]
func (h *Handler) AdminUpdateMaterial(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	material, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengupdate data"})
	}
	return c.JSON(material)
}

// AdminDeleteMaterial menghapus materi (admin only)
// @Summary      Delete material
// @Description  Menghapus materi berdasarkan ID
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Material ID"
// @Success      200 {object} MessageResponse
// @Router       /admin/materials/{id} [delete]
func (h *Handler) AdminDeleteMaterial(c *fiber.Ctx) error {
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

	admin.Get("/materials", h.AdminListMaterials)
	admin.Get("/materials/:id", h.AdminGetMaterial)
	admin.Post("/materials", h.AdminCreateMaterial)
	admin.Patch("/materials/:id", h.AdminUpdateMaterial)
	admin.Delete("/materials/:id", h.AdminDeleteMaterial)
}
