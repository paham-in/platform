package material

import (
	"errors"
	"strconv"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// callerAccess mengambil identitas & role pemanggil dari context middleware.
func callerAccess(c *fiber.Ctx) Access {
	callerID, _ := c.Locals("user_id").(uint)
	a := Access{CallerID: callerID}
	roles, _ := c.Locals("roles").([]string)
	for _, r := range roles {
		switch r {
		case "admin":
			a.IsAdmin = true
			a.IsStaff = true
		case "teacher":
			a.IsStaff = true
		}
	}
	return a
}

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

// AdminListMaterials mengembalikan daftar semua materi (admin only)
// @Summary      List materials
// @Description  Mengembalikan daftar semua materi, bisa difilter dengan chapter_id
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        chapter_id query int false "Filter by chapter ID"
// @Success      200 {array} MaterialResponse
// @Router       /admin/materials [get]
func (h *Handler) AdminListMaterials(c *fiber.Ctx) error {
	if chapterIDStr := c.Query("chapter_id"); chapterIDStr != "" {
		chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "chapter_id tidak valid"})
		}
		materials, err := h.svc.ListByChapter(uint(chapterID), callerAccess(c))
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(materials)
	}

	materials, err := h.svc.List(callerAccess(c))
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

	material, err := h.svc.Get(uint(id), callerAccess(c))
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
	if input.ChapterID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "chapter_id wajib diisi"})
	}

	material, err := h.svc.Create(input, callerAccess(c).CallerID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: err.Error()})
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

	material, err := h.svc.Update(uint(id), input, callerAccess(c))
	if err != nil {
		if errors.Is(err, ErrNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: err.Error()})
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

	if err := h.svc.Delete(uint(id), callerAccess(c)); err != nil {
		if errors.Is(err, ErrNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	admin.Get("/materials", h.AdminListMaterials)
	admin.Get("/materials/:id", h.AdminGetMaterial)
	admin.Post("/materials", h.AdminCreateMaterial)
	admin.Patch("/materials/:id", h.AdminUpdateMaterial)
	admin.Delete("/materials/:id", h.AdminDeleteMaterial)
}

// ListMaterials mengembalikan daftar materi (memerlukan login)
// @Summary      List materials
// @Description  Mengembalikan daftar materi published. User non-premium hanya melihat materi free.
// @Tags         Materials
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        chapter_id query int false "Filter by chapter ID"
// @Success      200 {array} MaterialResponse
// @Router       /materials [get]
func (h *Handler) ListMaterials(c *fiber.Ctx) error {
	includePremium := middleware.CanAccessPremium(c, h.db)
	classIDs := middleware.AccessibleClassIDs(c, h.db)

	if chapterIDStr := c.Query("chapter_id"); chapterIDStr != "" {
		chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "chapter_id tidak valid"})
		}
		materials, err := h.svc.ListPublishedByChapter(uint(chapterID), includePremium, classIDs)
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(materials)
	}

	materials, err := h.svc.ListPublished(includePremium, classIDs)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(materials)
}

// GetMaterial mengambil detail materi (memerlukan login)
// @Summary      Get material
// @Description  Mengambil detail materi berdasarkan ID untuk user yang sudah login
// @Tags         Materials
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Material ID"
// @Success      200 {object} MaterialResponse
// @Failure      404 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /materials/{id} [get]
func (h *Handler) GetMaterial(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	material, err := h.svc.Get(uint(id), callerAccess(c))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "materi tidak ditemukan"})
	}

	// premium butuh akses kelas tempat materi ini berada
	if !material.IsFree && !middleware.CanAccessClass(c, h.db, material.ClassID) {
		return c.Status(403).JSON(ErrorResponse{Error: "materi ini berbayar — berlangganan dulu"})
	}

	return c.JSON(material)
}

func PublicRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	app.Get("/materials", h.ListMaterials)
	app.Get("/materials/:id", h.GetMaterial)
}
