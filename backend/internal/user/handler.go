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

// Register mendaftarkan akun baru
// @Summary      Register user
// @Description  Mendaftarkan akun baru sebagai murid atau guru
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body RegisterInput true "Data registrasi"
// @Success      201 {object} AuthResponse
// @Failure      400 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /register [post]
func (h *Handler) Register(c *fiber.Ctx) error {
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	result, err := h.svc.Register(input)
	if err != nil {
		status := 500
		if err == errPasswordMismatch || err == errEmailExists {
			status = 400
		}
		return c.Status(status).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(result)
}

// Login masuk ke akun
// @Summary      Login user
// @Description  Login dengan email dan password, mengembalikan token session
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body LoginInput true "Data login"
// @Success      200 {object} AuthResponse
// @Failure      401 {object} ErrorResponse
// @Router       /login [post]
func (h *Handler) Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	result, err := h.svc.Login(input)
	if err != nil {
		status := 500
		if err == errInvalidCreds {
			status = 401
		}
		return c.Status(status).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.JSON(result)
}

// Logout keluar dari sesi
// @Summary      Logout user
// @Description  Menghapus session token dari database
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /logout [post]
func (h *Handler) Logout(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "token tidak ditemukan"})
	}

	if err := h.svc.Logout(token); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal logout"})
	}

	return c.JSON(MessageResponse{Message: "berhasil logout"})
}

// Me mengambil data user saat ini
// @Summary      Current user
// @Description  Mengembalikan data user berdasarkan token session
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} UserResponse
// @Failure      401 {object} ErrorResponse
// @Router       /me [get]
func (h *Handler) Me(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	user, err := h.svc.ValidateSession(token)
	if err != nil {
		return c.Status(401).JSON(ErrorResponse{Error: "session tidak valid"})
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
