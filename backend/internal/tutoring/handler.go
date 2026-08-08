package tutoring

import (
	"bytes"
	"image/jpeg"
	"io"
	"strconv"
	"time"

	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
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
	svc   *Service
	minio *storage.MinioClient
}

func NewHandler(svc *Service, minio *storage.MinioClient) *Handler {
	return &Handler{svc: svc, minio: minio}
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

// AdminListBookings returns all bookings (admin only)
// @Summary      List all bookings
// @Description  Mengembalikan daftar semua booking les privat dari semua murid & guru
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} BookingResponse
// @Router       /admin/tutoring/bookings [get]
func (h *Handler) AdminListBookings(c *fiber.Ctx) error {
	bookings, err := h.svc.ListAllBookings()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(bookings)
}

// AdminCreateBooking creates a booking manually for a student (admin only)
// @Summary      Create booking manually
// @Description  Admin mendaftarkan les privat untuk murid. Langsung confirmed + buat sesi & invoice.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body AdminCreateBookingInput true "Booking data"
// @Success      201 {object} BookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/bookings [post]
func (h *Handler) AdminCreateBooking(c *fiber.Ctx) error {
	var input AdminCreateBookingInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.StudentID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "student_id wajib diisi"})
	}
	if input.TeacherID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "teacher_id wajib diisi"})
	}
	booking, err := h.svc.AdminCreateBooking(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(booking)
}

// AdminListAvailability returns availability slots for a teacher (admin only)
// @Summary      List teacher availability
// @Description  Mengembalikan slot kosong guru tertentu (utk dialog booking manual)
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        teacher_id query int true "Teacher ID"
// @Success      200 {array} AvailabilityResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/availability [get]
func (h *Handler) AdminListAvailability(c *fiber.Ctx) error {
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

// ListSessions returns meeting sessions (teacher: all own sessions, student: paid sessions)
// @Summary      My sessions
// @Description  Jadwal pertemuan. Guru: semua sesi dari booking-nya. Murid: sesi setelah invoice lunas.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} TutoringSessionResponse
// @Router       /tutoring/sessions [get]
func (h *Handler) ListSessions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var sessions []TutoringSessionResponse
	var err error
	if hasRole(c, "teacher") || hasRole(c, "admin") {
		sessions, err = h.svc.ListTeacherSessions(userID)
	} else {
		sessions, err = h.svc.ListMySessions(userID)
	}
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	// murid hanya boleh melihat bukti yang sudah diverifikasi (done)
	isStaff := hasRole(c, "teacher") || hasRole(c, "admin")
	if !isStaff {
		for i := range sessions {
			if sessions[i].Status != "done" {
				sessions[i].EvidenceURL = ""
			}
		}
	}

	// ganti objectName bukti jadi presigned URL (kalau MinIO tersedia)
	for i := range sessions {
		if sessions[i].EvidenceURL == "" || h.minio == nil {
			continue
		}
		if url, err := h.minio.PresignedURL(c.Context(), sessions[i].EvidenceURL, 24*time.Hour); err == nil {
			sessions[i].EvidenceURL = url
		}
	}
	return c.JSON(sessions)
}

// UpdateSession reschedules a session (teacher only)
// @Summary      Reschedule session
// @Description  Guru memindahkan sesi pertemuan ke jadwal baru (setelah diskusi dgn murid). Tanpa approval.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Session ID"
// @Param        body body RescheduleSessionInput true "Jadwal baru"
// @Success      200  {object} TutoringSessionResponse
// @Failure      400  {object} ErrorResponse
// @Router       /tutoring/sessions/{id} [patch]
func (h *Handler) UpdateSession(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input RescheduleSessionInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	userID := c.Locals("user_id").(uint)
	session, err := h.svc.RescheduleSession(uint(id), userID, input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(session)
}

// CancelSession cancels a scheduled session (teacher only)
// @Summary      Cancel session
// @Description  Guru membatalkan sesi yang tidak bisa dihadiri. Invoice tidak berubah.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Session ID"
// @Success      200 {object} TutoringSessionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/sessions/{id}/cancel [post]
func (h *Handler) CancelSession(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	userID := c.Locals("user_id").(uint)
	session, err := h.svc.CancelSession(uint(id), userID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(session)
}

// UploadSessionEvidence uploads attendance photo (teacher only)
// @Summary      Upload attendance evidence
// @Description  Guru mengunggah foto bukti kehadiran sesi. Berhasil → sesi otomatis Selesai. Batas H+7 setelah sesi berakhir.
// @Tags         Tutoring
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id    path int  true "Session ID"
// @Param        image formData file true "Foto bukti"
// @Success      200  {object} TutoringSessionResponse
// @Failure      400  {object} ErrorResponse
// @Router       /tutoring/sessions/{id}/evidence [post]
func (h *Handler) UploadSessionEvidence(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	if h.minio == nil {
		return c.Status(500).JSON(ErrorResponse{Error: "penyimpanan file tidak tersedia"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	userID := c.Locals("user_id").(uint)

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

	srcBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}
	img, err := imaging.Decode(bytes.NewReader(srcBytes))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "format gambar tidak didukung"})
	}
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80}); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengompres gambar"})
	}

	objectName := h.minio.GenerateObjectNameIn("attendance", file.Filename)
	if err := h.minio.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(buf.Bytes()), int64(buf.Len())); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah file"})
	}

	session, err := h.svc.UploadEvidence(uint(id), userID, objectName)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(session)
}

// AdminListEvidence lists sessions with attendance evidence (admin only)
// @Summary      List attendance evidence
// @Description  Mengembalikan sesi yang punya bukti kehadiran. Filter status opsional: review/done.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        status query string false "Filter status: review atau done"
// @Success      200 {array} TutoringSessionResponse
// @Router       /admin/tutoring/evidence [get]
func (h *Handler) AdminListEvidence(c *fiber.Ctx) error {
	status := c.Query("status", "")
	if status != "" && status != "review" && status != "done" {
		return c.Status(400).JSON(ErrorResponse{Error: "status harus review atau done"})
	}
	sessions, err := h.svc.ListEvidence(status)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	for i := range sessions {
		if sessions[i].EvidenceURL == "" || h.minio == nil {
			continue
		}
		if url, err := h.minio.PresignedURL(c.Context(), sessions[i].EvidenceURL, 24*time.Hour); err == nil {
			sessions[i].EvidenceURL = url
		}
	}
	return c.JSON(sessions)
}

// AdminReviewEvidence approves or rejects attendance evidence (admin only)
// @Summary      Review attendance evidence
// @Description  Admin menyetujui atau menolak bukti kehadiran guru. Setujui → sesi Selesai. Tolak → sesi kembali Terjadwal & bukti dihapus.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int  true "Session ID"
// @Param        body body ReviewEvidenceInput true "Aksi: approve atau reject"
// @Success      200 {object} TutoringSessionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/evidence/{id} [patch]
func (h *Handler) AdminReviewEvidence(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input ReviewEvidenceInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	switch input.Action {
	case "approve":
		session, err := h.svc.ApproveEvidence(uint(id))
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.JSON(session)
	case "reject":
		session, oldObject, err := h.svc.RejectEvidence(uint(id))
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		if h.minio != nil && oldObject != "" {
			_ = h.minio.Delete(c.Context(), oldObject)
		}
		return c.JSON(session)
	default:
		return c.Status(400).JSON(ErrorResponse{Error: "action harus approve atau reject"})
	}
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

func AdminRoutes(admin fiber.Router, db *gorm.DB, minioClient *storage.MinioClient) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc, minioClient)

	admin.Get("/tutoring/bookings", h.AdminListBookings)
	admin.Post("/tutoring/bookings", h.AdminCreateBooking)
	admin.Get("/tutoring/availability", h.AdminListAvailability)
	admin.Get("/tutoring/evidence", h.AdminListEvidence)
	admin.Patch("/tutoring/evidence/:id", h.AdminReviewEvidence)
}

func Routes(auth fiber.Router, db *gorm.DB, minioClient *storage.MinioClient) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc, minioClient)

	auth.Get("/tutoring/teachers", h.ListTeachers)
	auth.Get("/tutoring/availability", h.ListAvailability)
	auth.Post("/tutoring/availability", h.CreateAvailability)
	auth.Delete("/tutoring/availability/:id", h.DeleteAvailability)
	auth.Get("/tutoring/bookings", h.ListBookings)
	auth.Post("/tutoring/bookings", h.CreateBooking)
	auth.Patch("/tutoring/bookings/:id", h.UpdateBookingStatus)
	auth.Get("/tutoring/groups/:token", h.GroupInfo)
	auth.Get("/tutoring/sessions", h.ListSessions)
	auth.Patch("/tutoring/sessions/:id", h.UpdateSession)
	auth.Post("/tutoring/sessions/:id/cancel", h.CancelSession)
	auth.Post("/tutoring/sessions/:id/evidence", h.UploadSessionEvidence)
}
