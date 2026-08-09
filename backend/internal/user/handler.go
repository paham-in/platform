package user

import (
	"errors"
	"strconv"

	"bimbel2/backend/internal/config"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc      *Service
	oauthCfg *OAuthConfig
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
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

// AdminListUsers mengembalikan daftar semua user (admin only)
// @Summary      List all users
// @Description  Mengembalikan daftar semua user (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        search query    string false "Filter by name or email"
// @Param        role    query    string false "Filter by role (student/teacher/admin)"
// @Success      200 {array} AdminUserResponse
// @Failure      500 {object} ErrorResponse
// @Router       /admin/users [get]
func (h *Handler) AdminListUsers(c *fiber.Ctx) error {
	search := c.Query("search", "")
	role := c.Query("role", "")

	users, err := h.svc.ListUsers(search, role)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data user"})
	}
	return c.JSON(users)
}

// AdminListStudents mengembalikan daftar user ber-role student (admin only)
// @Summary      List students
// @Description  Mengembalikan daftar semua user dengan role student (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} AdminUserResponse
// @Failure      500 {object} ErrorResponse
// @Router       /admin/students [get]
func (h *Handler) AdminListStudents(c *fiber.Ctx) error {
	users, err := h.svc.ListUsers("", "student")
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data siswa"})
	}
	return c.JSON(users)
}

// AdminMergeUser menghubungkan akun dummy ke akun Google yang sudah ada (admin only)
// @Summary      Hubungkan akun dummy ke akun Google
// @Description  Memindahkan data akun dummy (booking, invoice, akses kelas, forum) ke akun Google tujuan, lalu menghapus akun dummy
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id     path      int    true "Akun dummy user ID"
// @Param        body   body      object true "Akun Google tujuan"
// @Success      200  {object}  AdminUserResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users/{id}/merge [post]
func (h *Handler) AdminMergeUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input struct {
		TargetID uint `json:"target_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.TargetID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "target_id wajib diisi"})
	}
	user, err := h.svc.MergeDummyUser(uint(id), input.TargetID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(user)
}

// AdminUpdateRole mengubah role user (admin only)
// @Summary      Update user role
// @Description  Mengubah role user (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int                      true "User ID"
// @Param        body body      UpdateRoleRequest        true "Role baru"
// @Success      200  {object}  MessageResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users/{id}/role [patch]
func (h *Handler) AdminUpdateRole(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input struct {
		Roles []string `json:"roles"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	if err := h.svc.UpdateUserRole(uint(id), input.Roles); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.JSON(MessageResponse{Message: "role berhasil diubah"})
}

// AdminCreateUser membuat akun dummy student (admin only)
// @Summary      Create student (dummy)
// @Description  Membuat user ber-role student tanpa password utk murid yang belum punya akun (misal SD)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body      AdminCreateStudentInput true "Nama & email murid"
// @Success      201  {object}  AdminUserResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users [post]
func (h *Handler) AdminCreateUser(c *fiber.Ctx) error {
	var input AdminCreateStudentInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	user, err := h.svc.AdminCreateStudent(input)
	if err != nil {
		if errors.Is(err, errEmailExists) {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membuat user"})
	}
	return c.Status(201).JSON(user)
}

// AdminUpdateEmail mengganti email user (admin only)
// @Summary      Update user email
// @Description  Mengganti email user. Dipakai utk menghubungkan akun dummy dengan email asli murid.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int    true "User ID"
// @Param        body body      object true "Email baru"
// @Success      200  {object}  MessageResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users/{id}/email [patch]
func (h *Handler) AdminUpdateEmail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if err := h.svc.UpdateUserEmail(uint(id), input.Email); err != nil {
		if errors.Is(err, errEmailExists) {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengubah email"})
	}
	return c.JSON(MessageResponse{Message: "email berhasil diubah"})
}

// AdminUpdateTeacherSubjects mengubah mata pelajaran yang diajarkan guru (admin only)
// @Summary      Update teacher subjects
// @Description  Mengatur mata pelajaran yang diajarkan seorang guru (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int    true "User ID"
// @Param        body body      object true "Daftar subject_ids"
// @Success      200  {object}  AdminUserResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users/{id}/subjects [patch]
func (h *Handler) AdminUpdateTeacherSubjects(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input SetTeacherSubjectsInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	user, err := h.svc.SetTeacherSubjects(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.JSON(user)
}

// AdminDeleteUser menghapus user (admin only)
// @Summary      Delete user
// @Description  Menghapus user berdasarkan ID (admin only)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true "User ID"
// @Success      200  {object}  MessageResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /admin/users/{id} [delete]
func (h *Handler) AdminDeleteUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.DeleteUser(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus user"})
	}

	return c.JSON(MessageResponse{Message: "user berhasil dihapus"})
}

// UpdateProfile mengubah nama user saat ini
// @Summary      Update profile
// @Description  Mengubah nama user yang sedang login
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Data profile"
// @Success      200 {object} UserResponse
// @Failure      400 {object} ErrorResponse
// @Router       /me [patch]
func (h *Handler) UpdateProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	var input struct {
		Name       *string `json:"name"`
		SubjectIDs *[]uint `json:"subject_ids"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	user, err := h.svc.UpdateProfile(userID, UpdateProfileInput{Name: input.Name, SubjectIDs: input.SubjectIDs})
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.JSON(user)
}

// AdminTogglePayment mengubah status pembayaran user
// @Summary      Toggle payment status
// @Description  Mengubah status pembayaran user (pending/paid)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path     int    true "User ID"
// @Param        body body    object true "Status"
// @Success      200  {object} MessageResponse
// @Failure      400  {object} ErrorResponse
// @Router       /admin/users/{id}/payment [patch]
func (h *Handler) AdminTogglePayment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if err := h.svc.UpdatePaymentStatus(uint(id), input.Status); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "status berhasil diubah"})
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

	app.Post("/logout", h.Logout)
	app.Get("/me", h.Me)
}

func AuthRoutes(auth fiber.Router, db *gorm.DB) {
	userRepo := NewUserRepository(db)
	sessionRepo := NewSessionRepository(db)
	svc := NewService(userRepo, sessionRepo)
	h := NewHandler(svc)

	auth.Patch("/me", h.UpdateProfile)
}

func OAuthRoutes(app fiber.Router, db *gorm.DB, cfg *config.Config) {
	userRepo := NewUserRepository(db)
	sessionRepo := NewSessionRepository(db)
	svc := NewService(userRepo, sessionRepo)
	h := NewOAuthHandler(svc, cfg)

	app.Get("/auth/google", h.GoogleLogin)
	app.Get("/auth/google/callback", h.GoogleCallback)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	userRepo := NewUserRepository(db)
	sessionRepo := NewSessionRepository(db)
	svc := NewService(userRepo, sessionRepo)
	h := NewHandler(svc)

	admin.Get("/users", h.AdminListUsers)
	admin.Get("/students", h.AdminListStudents)
	admin.Post("/users", h.AdminCreateUser)
	admin.Post("/users/:id/merge", h.AdminMergeUser)
	admin.Patch("/users/:id/email", h.AdminUpdateEmail)
	admin.Patch("/users/:id/role", h.AdminUpdateRole)
	admin.Patch("/users/:id/subjects", h.AdminUpdateTeacherSubjects)
	admin.Patch("/users/:id/payment", h.AdminTogglePayment)
	admin.Delete("/users/:id", h.AdminDeleteUser)
}
