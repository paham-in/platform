package tutoring

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

func hasRole(c *fiber.Ctx, role string) bool {
	roles, _ := c.Locals("roles").([]string)
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

// ListTeachers returns all teachers (role teacher) for booking
// @Summary      List teachers
// @Description  Mengembalikan daftar guru yang tersedia untuk dibooking murid
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} TeacherResponse
// @Router       /tutoring/teachers [get]
func (h *Handler) ListTeachers(c *fiber.Ctx) error {
	teachers, err := h.svc.ListTeachers()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(teachers)
}

// ListAvailability returns availability slots (teacher: own, student: by teacher_id)
// @Summary      List availability
// @Description  Returns availability slots. Teachers see their own; students pass ?teacher_id=
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        teacher_id query int false "Teacher ID (for students)"
// @Success      200 {array} AvailabilityResponse
// @Router       /tutoring/availability [get]
func (h *Handler) ListAvailability(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	if hasRole(c, "teacher") || hasRole(c, "admin") {
		slots, err := h.svc.ListAvailability(userID)
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(slots)
	}

	// student or admin: filter by teacher_id
	teacherIDStr := c.Query("teacher_id")
	if teacherIDStr == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "teacher_id wajib diisi"})
	}
	tid, err := strconv.ParseUint(teacherIDStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "teacher_id tidak valid"})
	}
	slots, err := h.svc.ListAvailability(uint(tid))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(slots)
}

// CreateAvailability adds a new time slot (teacher only)
// @Summary      Create availability
// @Description  Menambah slot waktu kosong guru
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateAvailabilityInput true "Slot data"
// @Success      201 {object} AvailabilityResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/availability [post]
func (h *Handler) CreateAvailability(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}

	var input CreateAvailabilityInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	userID := c.Locals("user_id").(uint)
	slot, err := h.svc.CreateAvailability(userID, input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(slot)
}

// DeleteAvailability removes a time slot (teacher only)
// @Summary      Delete availability
// @Description  Menghapus slot waktu kosong guru
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Slot ID"
// @Success      200 {object} MessageResponse
// @Router       /tutoring/availability/{id} [delete]
func (h *Handler) DeleteAvailability(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	userID := c.Locals("user_id").(uint)
	if err := h.svc.DeleteAvailability(uint(id), userID); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus slot"})
	}
	return c.JSON(MessageResponse{Message: "slot berhasil dihapus"})
}

// ListBookings returns bookings (teacher sees theirs, student sees theirs)
// @Summary      List bookings
// @Description  Returns bookings. Teachers see bookings for their slots; students see their own.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} BookingResponse
// @Router       /tutoring/bookings [get]
func (h *Handler) ListBookings(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	if hasRole(c, "teacher") || hasRole(c, "admin") {
		bookings, err := h.svc.ListTeacherBookings(userID)
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(bookings)
	}

	bookings, err := h.svc.ListMyBookings(userID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(bookings)
}

// CreateBooking creates a new booking request (student or free user)
// @Summary      Create booking
// @Description  Murid booking jadwal guru. User gratis boleh join grup semi-private (role student digrant otomatis saat invoice lunas).
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateBookingInput true "Booking data"
// @Success      201 {object} BookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/bookings [post]
func (h *Handler) CreateBooking(c *fiber.Ctx) error {
	if !hasRole(c, "student") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk murid"})
	}

	var input CreateBookingInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	userID := c.Locals("user_id").(uint)
	booking, err := h.svc.CreateBooking(userID, input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(booking)
}

// GroupInfo returns group info for a share link
// @Summary      Group info
// @Description  Mengembalikan info grup semi-private dari token undangan
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        token path string true "Group token"
// @Success      200 {object} GroupInfoResponse
// @Failure      404 {object} ErrorResponse
// @Router       /tutoring/groups/{token} [get]
func (h *Handler) GroupInfo(c *fiber.Ctx) error {
	token := c.Params("token")
	if token == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "token wajib diisi"})
	}
	info, err := h.svc.ListGroupInfo(token)
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(info)
}

// ListSessions returns upcoming sessions for the logged-in student
// @Summary      My sessions
// @Description  Mengembalikan jadwal pertemuan (muncul setelah invoice lunas)
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} TutoringSessionResponse
// @Router       /tutoring/sessions [get]
func (h *Handler) ListSessions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	sessions, err := h.svc.ListMySessions(userID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(sessions)
}

// UpdateBookingStatus confirms or rejects a booking (teacher only)
// @Summary      Update booking status
// @Description  Guru menyetujui atau menolak booking
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Booking ID"
// @Param        body body object true "Status baru"
// @Success      200 {object} BookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/bookings/{id} [patch]
func (h *Handler) UpdateBookingStatus(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}

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
	userID := c.Locals("user_id").(uint)
	booking, err := h.svc.UpdateBookingStatus(uint(id), userID, input.Status)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(booking)
}

func Routes(auth fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	auth.Get("/tutoring/teachers", h.ListTeachers)
	auth.Get("/tutoring/availability", h.ListAvailability)
	auth.Post("/tutoring/availability", h.CreateAvailability)
	auth.Delete("/tutoring/availability/:id", h.DeleteAvailability)
	auth.Get("/tutoring/bookings", h.ListBookings)
	auth.Post("/tutoring/bookings", h.CreateBooking)
	auth.Patch("/tutoring/bookings/:id", h.UpdateBookingStatus)
	auth.Get("/tutoring/groups/:token", h.GroupInfo)
	auth.Get("/tutoring/sessions", h.ListSessions)
}
