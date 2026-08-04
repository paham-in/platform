package invoice

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

// MyInvoices mengembalikan daftar invoice user yang sedang login
// @Summary      My invoices
// @Description  Mengembalikan daftar invoice pembayaran milik user yang login
// @Tags         Student
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} InvoiceResponse
// @Router       /invoices [get]
func (h *Handler) MyInvoices(c *fiber.Ctx) error {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}
	invoices, err := h.svc.ListByUser(u.ID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(invoices)
}

// AdminListInvoices mengembalikan daftar semua invoice
// @Summary      List invoices
// @Description  Mengembalikan daftar semua invoice pembayaran
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        user_id query int false "Filter by user ID"
// @Param        status query string false "Filter by status (paid/pending)"
// @Param        search query string false "Search by note, start_date, or end_date"
// @Success      200 {array} InvoiceResponse
// @Router       /admin/invoices [get]
func (h *Handler) AdminListInvoices(c *fiber.Ctx) error {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "user_id wajib diisi"})
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "user_id tidak valid"})
	}
	status := c.Query("status")
	search := c.Query("search")
	invoices, err := h.svc.ListByUserFiltered(uint(userID), status, search)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(invoices)
}

// AdminCreateInvoice membuat invoice baru
// @Summary      Create invoice
// @Description  Membuat invoice pembayaran baru
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Data invoice"
// @Success      201 {object} InvoiceResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/invoices [post]
func (h *Handler) AdminCreateInvoice(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	invoice, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(invoice)
}

// AdminToggleInvoice mengubah status invoice (pending ↔ paid)
// @Summary      Toggle invoice status
// @Description  Mengubah status invoice dari pending ke paid atau sebaliknya
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Invoice ID"
// @Success      200 {object} InvoiceResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/invoices/{id}/toggle [patch]
func (h *Handler) AdminToggleInvoice(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	invoice, err := h.svc.ToggleStatus(uint(id))
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(invoice)
}

// AdminDeleteInvoice menghapus invoice
// @Summary      Delete invoice
// @Description  Menghapus invoice berdasarkan ID
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Invoice ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/invoices/{id} [delete]
func (h *Handler) AdminDeleteInvoice(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus invoice"})
	}
	return c.JSON(MessageResponse{Message: "invoice berhasil dihapus"})
}

func AuthRoutes(auth fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	auth.Get("/invoices", h.MyInvoices)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Get("/invoices", h.AdminListInvoices)
	admin.Post("/invoices", h.AdminCreateInvoice)
	admin.Patch("/invoices/:id/toggle", h.AdminToggleInvoice)
	admin.Delete("/invoices/:id", h.AdminDeleteInvoice)
}
