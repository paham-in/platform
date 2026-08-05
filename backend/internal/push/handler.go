package push

import (
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

type SubscribeInput struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
}

// Subscribe mencatat subscription push milik user
// @Summary      Subscribe push
// @Description  Menyimpan subscription push notification untuk user
// @Tags         Push
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body SubscribeInput true "Subscription data"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /push/subscribe [post]
func (h *Handler) Subscribe(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	var input SubscribeInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Endpoint == "" || input.Keys.P256dh == "" || input.Keys.Auth == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "endpoint, p256dh, dan auth wajib diisi"})
	}

	if err := h.svc.Subscribe(userID, input.Endpoint, input.Keys.P256dh, input.Keys.Auth); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan subscription"})
	}
	return c.JSON(MessageResponse{Message: "subscription berhasil disimpan"})
}

// PublicKey mengembalikan VAPID public key agar frontend bisa subscribe.
// @Summary      VAPID public key
// @Description  Mengembalikan VAPID public key untuk web push
// @Tags         Push
// @Produce      json
// @Success      200 {object} map[string]string
// @Router       /push/public-key [get]
func (h *Handler) PublicKey(c *fiber.Ctx) error {
	if h.svc.vapidPublicKey == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "VAPID public key belum dikonfigurasi"})
	}
	return c.JSON(fiber.Map{"public_key": h.svc.vapidPublicKey})
}

func Routes(auth fiber.Router, db *gorm.DB, vapidPublicKey, vapidPrivateKey, vapidSubject string) {
	svc := NewService(db, vapidPublicKey, vapidPrivateKey, vapidSubject)
	h := NewHandler(svc)

	auth.Get("/push/public-key", h.PublicKey)
	auth.Post("/push/subscribe", h.Subscribe)
}
