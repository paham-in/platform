package studentprogram

import (
	"strconv"

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

// AdminListStudentPrograms daftar hak akses student-program
// @Summary      List student programs
// @Tags         StudentProgram
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        user_id query int false "Filter by user ID"
// @Param        program_id query int false "Filter by program ID"
// @Success      200 {array} StudentProgramResponse
// @Router       /admin/student-programs [get]
func (h *Handler) AdminListStudentPrograms(c *fiber.Ctx) error {
	filter := ListFilter{}
	if uid := c.Query("user_id"); uid != "" {
		if id, err := strconv.ParseUint(uid, 10, 64); err == nil {
			filter.UserID = uint(id)
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

// AdminGrantStudentProgram beri student akses program (manual grant)
// @Summary      Grant student program
// @Tags         StudentProgram
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data"
// @Success      201 {object} StudentProgramResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/student-programs [post]
func (h *Handler) AdminGrantStudentProgram(c *fiber.Ctx) error {
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

// AdminRevokeStudentProgram cabut akses student-program
// @Summary      Revoke student program
// @Tags         StudentProgram
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "StudentProgram ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/student-programs/{id} [delete]
func (h *Handler) AdminRevokeStudentProgram(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mencabut akses"})
	}
	return c.JSON(MessageResponse{Message: "akses berhasil dicabut"})
}

// MyStudentPrograms daftar akses program milik user yang login
// @Summary      My student programs
// @Tags         StudentProgram
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} StudentProgramResponse
// @Router       /student-programs [get]
func (h *Handler) MyStudentPrograms(c *fiber.Ctx) error {
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

func AuthRoutes(auth fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	auth.Get("/student-programs", h.MyStudentPrograms)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	admin.Get("/student-programs", h.AdminListStudentPrograms)
	admin.Post("/student-programs", h.AdminGrantStudentProgram)
	admin.Delete("/student-programs/:id", h.AdminRevokeStudentProgram)
}
