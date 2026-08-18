package notification

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ListNotifications mengembalikan daftar notifikasi user yang login
// @Summary      List notifications
// @Description  Mengembalikan daftar notifikasi milik user yang login
// @Tags         Notification
// @Produce      json
// @Security     BearerAuth
// @Param        limit  query int false "Jumlah data per halaman (default 20)"
// @Param        offset query int false "Offset data (default 0)"
// @Success      200 {object} ListNotificationsResponse
// @Router       /notifications [get]
func (h *Handler) ListNotifications(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	notifications, total, err := h.svc.ListByUser(userID, limit, offset)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil notifikasi"})
	}

	return c.JSON(ListNotificationsResponse{
		Notifications: notifications,
		Total:         total,
	})
}

// UnreadCount mengembalikan jumlah notifikasi yang belum dibaca
// @Summary      Unread notification count
// @Description  Mengembalikan jumlah notifikasi yang belum dibaca
// @Tags         Notification
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} UnreadCountResponse
// @Router       /notifications/unread-count [get]
func (h *Handler) UnreadCount(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	count, err := h.svc.UnreadCount(userID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil jumlah notifikasi"})
	}

	return c.JSON(UnreadCountResponse{Count: count})
}

// MarkRead menandai satu notifikasi sudah dibaca
// @Summary      Mark notification read
// @Description  Menandai satu notifikasi sudah dibaca
// @Tags         Notification
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Notification ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /notifications/{id}/read [patch]
func (h *Handler) MarkRead(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.MarkRead(userID, uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menandai notifikasi"})
	}

	return c.JSON(MessageResponse{Message: "notifikasi ditandai sudah dibaca"})
}

// MarkAllRead menandai semua notifikasi sudah dibaca
// @Summary      Mark all notifications read
// @Description  Menandai semua notifikasi user sudah dibaca
// @Tags         Notification
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} MessageResponse
// @Router       /notifications/read-all [patch]
func (h *Handler) MarkAllRead(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	if err := h.svc.MarkAllRead(userID); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menandai notifikasi"})
	}

	return c.JSON(MessageResponse{Message: "semua notifikasi ditandai sudah dibaca"})
}

type ListNotificationsResponse struct {
	Notifications []NotificationResponse `json:"notifications"`
	Total         int64                  `json:"total"`
}

type UnreadCountResponse struct {
	Count int64 `json:"count"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

func Routes(auth fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	auth.Get("/notifications", h.ListNotifications)
	auth.Get("/notifications/unread-count", h.UnreadCount)
	auth.Patch("/notifications/:id/read", h.MarkRead)
	auth.Patch("/notifications/read-all", h.MarkAllRead)
}
