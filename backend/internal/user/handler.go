package user

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "format data tidak valid"})
	}

	result, err := h.svc.Register(input)
	if err != nil {
		status := 500
		if err == errPasswordMismatch || err == errEmailExists {
			status = 400
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(result)
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "format data tidak valid"})
	}

	result, err := h.svc.Login(input)
	if err != nil {
		status := 500
		if err == errInvalidCreds {
			status = 401
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(400).JSON(fiber.Map{"error": "token tidak ditemukan"})
	}

	if err := h.svc.Logout(token); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal logout"})
	}

	return c.JSON(fiber.Map{"message": "berhasil logout"})
}

func (h *Handler) Me(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	user, err := h.svc.ValidateSession(token)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "session tidak valid"})
	}

	return c.JSON(toResponse(*user))
}

func extractToken(c *fiber.Ctx) string {
	auth := c.Get("Authorization")
	if len(auth) > 7 && auth[:7] == "Bearer " {
		return auth[7:]
	}
	return ""
}

func Routes(app fiber.Router, db *gorm.DB) {
	userRepo := NewUserRepository(db)
	sessionRepo := NewSessionRepository(db)
	svc := NewService(userRepo, sessionRepo)
	h := NewHandler(svc)

	app.Post("/register", h.Register)
	app.Post("/login", h.Login)
	app.Post("/logout", h.Logout)
	app.Get("/me", h.Me)
}
