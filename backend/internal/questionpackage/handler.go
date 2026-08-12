package questionpackage

import (
	"errors"
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

// scopeClassIDs mengembalikan class_id yang boleh diakses utk scoping konten.
// admin/teacher → nil (semua); student → kelas aktif, [] kosong kalau tak punya
// (supaya cuma grup free yang muncul).
func (h *Handler) scopeClassIDs(c *fiber.Ctx) []uint {
	roles, ok := c.Locals("roles").([]string)
	if ok {
		for _, r := range roles {
			if r == "admin" || r == "teacher" {
				return nil
			}
		}
	}
	ids := middleware.AccessibleClassIDs(c, h.db)
	if ids == nil {
		ids = []uint{}
	}
	return ids
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

// AdminListGroups mengembalikan daftar grup paket soal
// @Summary      List question package groups
// @Description  Mengembalikan daftar grup paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} GroupResponse
// @Router       /admin/question-package-groups [get]
func (h *Handler) AdminListGroups(c *fiber.Ctx) error {
	groups, err := h.svc.ListGroups(nil)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(groups)
}

// AdminCreateGroup membuat grup paket soal baru
// @Summary      Create question package group
// @Description  Membuat grup paket soal baru (bundel per kelas)
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body GroupCreateInput true "Data grup"
// @Success      201 {object} GroupResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-package-groups [post]
func (h *Handler) AdminCreateGroup(c *fiber.Ctx) error {
	var input GroupCreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	group, err := h.svc.CreateGroup(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(group)
}

// AdminUpdateGroup mengubah grup paket soal
// @Summary      Update question package group
// @Description  Mengubah grup paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int             true "Group ID"
// @Param        body body GroupUpdateInput true "Data update"
// @Success      200 {object} GroupResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-package-groups/{id} [patch]
func (h *Handler) AdminUpdateGroup(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input GroupUpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	group, err := h.svc.UpdateGroup(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(group)
}

// AdminDeleteGroup menghapus grup paket soal
// @Summary      Delete question package group
// @Description  Menghapus grup paket soal; paket di dalamnya tetap ada tapi lepas dari grup
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Group ID"
// @Success      200 {object} MessageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-package-groups/{id} [delete]
func (h *Handler) AdminDeleteGroup(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.DeleteGroup(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus grup"})
	}
	return c.JSON(MessageResponse{Message: "grup berhasil dihapus"})
}

// MyPackages mengembalikan daftar paket soal untuk murid/user.
// @Summary      List visible question packages
// @Description  Mengembalikan daftar paket soal. User hanya melihat paket dalam grup
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} PackageResponse
// @Router       /question-packages [get]
func (h *Handler) MyPackages(c *fiber.Ctx) error {
	packages, err := h.svc.ListVisible(h.scopeClassIDs(c))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(packages)
}

// MyPackage mengembalikan detail paket soal untuk murid/user.
// @Summary      Get visible question package
// @Description  Mengambil detail paket soal. Paket premium hanya untuk yang punya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {object} PackageResponse
// @Failure      404 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-packages/{id} [get]
func (h *Handler) MyPackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	pkg, err := h.svc.GetVisible(uint(id), h.scopeClassIDs(c))
	if err != nil {
		if errors.Is(err, ErrNoAccess) {
			return c.Status(403).JSON(ErrorResponse{Error: "paket ini belum tersedia untukmu"})
		}
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	return c.JSON(pkg)
}

// MyGroups mengembalikan daftar grup paket soal untuk murid/user.
// @Summary      List visible question package groups
// @Description  Mengembalikan daftar grup paket soal. Grup premium hanya untuk
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} GroupResponse
// @Router       /question-package-groups [get]
func (h *Handler) MyGroups(c *fiber.Ctx) error {
	groups, err := h.svc.ListGroups(h.scopeClassIDs(c))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(groups)
}

// MyGroup mengembalikan detail grup paket soal untuk murid/user.
// @Summary      Get visible question package group
// @Description  Mengambil detail grup paket soal beserta paket di dalamnya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Group ID"
// @Success      200 {object} GroupResponse
// @Failure      404 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-package-groups/{id} [get]
func (h *Handler) MyGroup(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	group, err := h.svc.GetGroup(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "grup tidak ditemukan"})
	}

	classIDs := h.scopeClassIDs(c)
	allowed := group.IsFree || classIDs == nil // staff → semua
	if !allowed {
		for _, cid := range classIDs {
			if cid == group.ClassID {
				allowed = true
				break
			}
		}
	}
	if !allowed {
		return c.Status(403).JSON(ErrorResponse{Error: "grup ini belum tersedia untukmu"})
	}
	return c.JSON(group)
}

func Routes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	admin.Get("/question-packages", h.ListPackages)
	admin.Get("/question-packages/:id", h.GetPackage)
	admin.Post("/question-packages", h.CreatePackage)
	admin.Patch("/question-packages/:id", h.UpdatePackage)
	admin.Delete("/question-packages/:id", h.DeletePackage)
	admin.Get("/question-package-groups", h.AdminListGroups)
	admin.Post("/question-package-groups", h.AdminCreateGroup)
	admin.Patch("/question-package-groups/:id", h.AdminUpdateGroup)
	admin.Delete("/question-package-groups/:id", h.AdminDeleteGroup)
}

func AuthRoutes(auth fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	auth.Get("/question-packages", h.MyPackages)
	auth.Get("/question-packages/:id", h.MyPackage)
	auth.Get("/question-package-groups", h.MyGroups)
	auth.Get("/question-package-groups/:id", h.MyGroup)
}
