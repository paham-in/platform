package paymentproof

import (
	"errors"
	"strconv"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type Handler struct {
	svc     *Service
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewHandler(svc *Service, repo *Repository, store *storage.ObjectStorage) *Handler {
	return &Handler{svc: svc, repo: repo, storage: store}
}

// UploadProof mengunggah bukti pembayaran untuk invoice tertentu.
// Hanya student yang bisa upload, dan hanya untuk invoice miliknya yang masih pending.
//
// @Summary      Upload payment proof
// @Description  Student unggah bukti transfer pembayaran untuk invoice yang masih pending. File disimpan di storage private, bisa dilihat admin via presigned URL.
// @Tags         Student
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        invoice_id path int true "Invoice ID"
// @Param        image formData file true "Foto bukti transfer (jpg, png, gif, webp, max 5MB)"
// @Success      201 {object} UploadResponse
// @Failure      400 {object} ErrorResponse
// @Router       /invoices/{invoice_id}/proof [post]
func (h *Handler) UploadProof(c *fiber.Ctx) error {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	invoiceID, err := strconv.ParseUint(c.Params("invoice_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id invoice tidak valid"})
	}

	if h.storage == nil {
		return c.Status(503).JSON(ErrorResponse{Error: "penyimpanan file tidak tersedia"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(ErrorResponse{Error: "format file harus jpg, png, gif, atau webp"})
	}
	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(ErrorResponse{Error: "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	proof, err := h.svc.Upload(c.Context(), uint(invoiceID), u.ID, f, file.Filename, ct, file.Size)
	if err != nil {
		if errors.Is(err, gorm.ErrInvalidData) {
			return c.Status(403).JSON(ErrorResponse{Error: "bukan invoice milikmu atau invoice tidak pending"})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah bukti pembayaran"})
	}
	return c.Status(201).JSON(proof)
}

// ListProofs mengembalikan semua bukti pembayaran untuk invoice tertentu.
// Student lihat proof sendiri, admin lihat proof semua.
//
// @Summary      List payment proofs
// @Description  Mengembalikan daftar bukti pembayaran untuk invoice, termasuk URL presigned untuk yang sudah approved.
// @Tags         Student
// @Produce      json
// @Security     BearerAuth
// @Param        invoice_id path int true "Invoice ID"
// @Success      200 {array} ProofDetail
// @Router       /invoices/{invoice_id}/proof [get]
func (h *Handler) ListProofs(c *fiber.Ctx) error {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	invoiceID, err := strconv.ParseUint(c.Params("invoice_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id invoice tidak valid"})
	}

	// validasi akses: student boleh lihat proof invoice miliknya; admin lihat semua
	var invoice models.Invoice
	if err := h.svc.db.First(&invoice, invoiceID).Error; err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "invoice tidak ditemukan"})
	}
	if invoice.UserID != u.ID {
		role := roleFrom(c)
		if role != "admin" {
			return c.Status(403).JSON(ErrorResponse{Error: "bukan invoice milikmu"})
		}
	}

	proofs, err := h.svc.GetByInvoice(c.Context(), uint(invoiceID), 24*time.Hour)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(proofs)
}

// Routes register payment-proof endpoints. Dipanggil dari main.go pada
// `auth` group (butuh session).
func Routes(auth fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	if store == nil {
		return
	}
	repo := NewRepository(db)
	svc := NewService(repo, db, store)
	h := NewHandler(svc, repo, store)
	auth.Post("/invoices/:invoice_id/proof", h.UploadProof)
	auth.Get("/invoices/:invoice_id/proof", h.ListProofs)
}

// AdminRoutes register payment-proof admin endpoints (approve).
// Dipanggil dari main.go pada `admin` group (role admin only).
func AdminRoutes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	if store == nil {
		return
	}
	repo := NewRepository(db)
	svc := NewService(repo, db, store)
	h := NewHandler(svc, repo, store)
	admin.Patch("/payment-proofs/:id/approve", h.ApproveProof)
}

// ApproveProof admin-approve bukti pembayaran.
//
// @Summary      Approve payment proof
// @Description  Admin menyetujui bukti pembayaran. Setelah approve, proof bisa
//               dihapus oleh cron job setelah melewati retention period.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "PaymentProof ID"
// @Success      200 {object} map[string]interface{}
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/payment-proofs/{id}/approve [patch]
func (h *Handler) ApproveProof(c *fiber.Ctx) error {
	if roleFrom(c) != "admin" {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya admin yang bisa approve"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.ApproveByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: "bukti pembayaran tidak ditemukan"})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal approve"})
	}
	return c.JSON(fiber.Map{"message": "bukti pembayaran disetujui"})
}

// roleFrom mengekstrak role admin dari locals (untuk akses lintas-user).
func roleFrom(c *fiber.Ctx) string {
	roles, _ := c.Locals("roles").([]string)
	for _, r := range roles {
		if r == "admin" {
			return "admin"
		}
	}
	if len(roles) > 0 {
		return roles[0]
	}
	return ""
}
