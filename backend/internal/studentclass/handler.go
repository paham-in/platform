package studentclass

import (
	"strconv"

	"bimbel2/backend/internal/notification"

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

// AdminListStudentClasses daftar hak akses student-class
// @Summary      List student classes
// @Tags         StudentClass
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        user_id query int false "Filter by user ID"
// @Param        class_id query int false "Filter by class ID"
// @Param        program_id query int false "Filter by program ID"
// @Param        search query string false "Filter by student name/email, class, or program"
// @Success      200 {array} StudentClassEnrollmentResponse
// @Router       /admin/student-class-enrollments [get]
func (h *Handler) AdminListStudentClasses(c *fiber.Ctx) error {
	filter := ListFilter{Search: c.Query("search", "")}
	if uid := c.Query("user_id"); uid != "" {
		if id, err := strconv.ParseUint(uid, 10, 64); err == nil {
			filter.UserID = uint(id)
		}
	}
	if cid := c.Query("class_id"); cid != "" {
		if id, err := strconv.ParseUint(cid, 10, 64); err == nil {
			filter.ClassID = uint(id)
		}
	}
	if pid := c.Query("program_id"); pid != "" {
		if id, err := strconv.ParseUint(pid, 10, 64); err == nil {
			filter.ProgramID = uint(id)
		}
	}
	sp, err := h.svc.List(filter)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(sp)
}

// AdminGrantStudentClass beri student akses kelas (manual grant)
// @Summary      Grant student class
// @Tags         StudentClass
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data"
// @Success      201 {object} StudentClassEnrollmentResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/student-class-enrollments [post]
func (h *Handler) AdminGrantStudentClass(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	sp, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(sp)
}

// AdminRevokeStudentClass cabut akses student-class
// @Summary      Revoke student class
// @Tags         StudentClass
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "StudentClass ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/student-class-enrollments/{id} [delete]
func (h *Handler) AdminRevokeStudentClass(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mencabut akses"})
	}
	return c.JSON(MessageResponse{Message: "akses berhasil dicabut"})
}

// MyStudentClasses daftar akses kelas milik user yang login
// @Summary      My student classes
// @Tags         StudentClass
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} StudentClassEnrollmentResponse
// @Router       /student-class-enrollments [get]
func (h *Handler) MyStudentClasses(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}
	sp, err := h.svc.List(ListFilter{UserID: userID})
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(sp)
}

func AuthRoutes(auth fiber.Router, db *gorm.DB, notifSvc *notification.Service) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	svc.SetNotificationService(notifSvc)
	h := NewHandler(svc)

	auth.Get("/student-class-enrollments", h.MyStudentClasses)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, notifSvc *notification.Service) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	svc.SetNotificationService(notifSvc)
	h := NewHandler(svc)

	admin.Get("/student-class-enrollments", h.AdminListStudentClasses)
	admin.Post("/student-class-enrollments", h.AdminGrantStudentClass)
	admin.Delete("/student-class-enrollments/:id", h.AdminRevokeStudentClass)
}
