package tutoring

import (
	"bytes"
	"image/jpeg"
	"io"
	"strconv"
	"time"

	"bimbel2/backend/internal/notification"
	"bimbel2/backend/internal/setting"
	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc     *Service
	storage *storage.ObjectStorage
}

func NewHandler(svc *Service, store *storage.ObjectStorage) *Handler {
	return &Handler{svc: svc, storage: store}
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
// @Description  Mengembalikan daftar guru. Bisa difilter by subject_id, dan kalau isi date+start_time+end_time, hanya guru yang free (tanpa booking/sesi bentrok) di jadwal itu.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id  query int    false "Filter guru yang mengajar mapel ini"
// @Param        date        query string false "Filter guru free di tanggal ini (YYYY-MM-DD)"
// @Param        start_time  query string false "Waktu mulai (HH:mm), wajib bila date diisi"
// @Param        end_time    query string false "Waktu selesai (HH:mm), wajib bila date diisi"
// @Success      200 {array} ListTeachersResponse
// @Router       /tutoring/teachers [get]
func (h *Handler) ListTeachers(c *fiber.Ctx) error {
	var filter ListTeachersRequest
	if v := c.Query("subject_id"); v != "" {
		id, err := strconv.ParseUint(v, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "subject_id tidak valid"})
		}
		uid := uint(id)
		filter.SubjectID = &uid
	}
	filter.Date = c.Query("date")
	filter.StartTime = c.Query("start_time")
	filter.EndTime = c.Query("end_time")

	teachers, err := h.svc.ListTeachers(filter)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(teachers)
}

// ListBookings returns bookings (teacher sees theirs, student sees theirs)
// @Summary      List bookings
// @Description  Returns bookings. Teachers see bookings for their slots; students see their own.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} ListBookingsResponse
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
// @Description  Murid booking jadwal guru. User gratis boleh join grup (role student digrant otomatis saat invoice lunas).
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateBookingRequest true "Booking data"
// @Success      201 {object} CreateBookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/bookings [post]
func (h *Handler) CreateBooking(c *fiber.Ctx) error {
	if !hasRole(c, "student") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk murid"})
	}

	var input CreateBookingRequest
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
// @Success      200 {array} AdminListBookingsResponse
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
// @Param        body body AdminCreateBookingRequest true "Booking data"
// @Success      201 {object} AdminCreateBookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/bookings [post]
func (h *Handler) AdminCreateBooking(c *fiber.Ctx) error {
	var input AdminCreateBookingRequest
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

// AdminDeleteBooking menghapus booking les beserta sesi & invoice (admin)
// @Summary      Delete booking
// @Description  Menghapus booking beserta sesi dan invoice terkait. Dipakai utk koreksi booking manual yang salah input.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Booking ID"
// @Success      200 {object} AdminDeleteBookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/bookings/{id} [delete]
func (h *Handler) AdminDeleteBooking(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.AdminDeleteBooking(uint(id)); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(newAdminDeleteBookingResponse())
}

// AssignTeacher assigns a teacher to a booking without one (admin only)
// @Summary      Assign teacher to booking
// @Description  Admin menetapkan guru ke booking tanpa guru. Status tetap pending, guru lalu approve sendiri.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int true "Booking ID"
// @Param        body body AssignTeacherRequest true "Teacher ID"
// @Success      200 {object} AssignTeacherResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/bookings/{id}/assign [patch]
func (h *Handler) AssignTeacher(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input AssignTeacherRequest
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.TeacherID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "teacher_id wajib diisi"})
	}
	booking, err := h.svc.AssignTeacher(uint(id), input.TeacherID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(booking)
}

// ListSessions returns meeting sessions (teacher: all own sessions, student: paid sessions)
// @Summary      My sessions
// @Description  Jadwal pertemuan. Guru: semua sesi dari booking-nya. Murid: sesi setelah invoice lunas.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} ListSessionsResponse
// @Router       /tutoring/sessions [get]
func (h *Handler) ListSessions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var sessions []ListSessionsResponse
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

	// ganti objectName bukti jadi presigned URL (kalau storage tersedia)
	for i := range sessions {
		if sessions[i].EvidenceURL == "" || h.storage == nil {
			continue
		}
		if url, err := h.storage.URL(c.Context(), sessions[i].EvidenceURL, 24*time.Hour); err == nil {
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
// @Param        body body UpdateSessionRequest true "Jadwal baru"
// @Success      200  {object} UpdateSessionResponse
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
	var input UpdateSessionRequest
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
// @Success      200 {object} CancelSessionResponse
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
// @Success      200  {object} UploadSessionEvidenceResponse
// @Failure      400  {object} ErrorResponse
// @Router       /tutoring/sessions/{id}/evidence [post]
func (h *Handler) UploadSessionEvidence(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	if h.storage == nil {
		return c.Status(500).JSON(ErrorResponse{Error: "penyimpanan file tidak tersedia"})
	}
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	userID := c.Locals("user_id").(uint)

	// validasi ownership/status/jendela upload SEBELUM upload file ke storage
	// hindari file orphan kalau sesi bukan milik guru / belum waktunya.
	if err := h.svc.ValidateEvidenceUpload(uint(id), userID); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

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

	objectName := h.storage.GenerateObjectNamePrivateIn("attendance", file.Filename)
	if err := h.storage.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(buf.Bytes()), int64(buf.Len())); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah file"})
	}

	session, oldObject, err := h.svc.UploadEvidence(uint(id), userID, objectName)
	if err != nil {
		// file sudah ter-upload tapi simpan DB gagal, hapus biar tidak orphan.
		_ = h.storage.Delete(c.Context(), objectName)
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	// ganti foto (retake): hapus file bukti lama dari storage, best-effort,
	// karena DB sudah konsisten menunjuk file baru.
	if oldObject != "" && h.storage != nil {
		_ = h.storage.Delete(c.Context(), oldObject)
	}
	return c.JSON(session)
}

// AdminListEvidence lists sessions with attendance evidence (admin only)
// @Summary      List attendance evidence
// @Description  Mengembalikan sesi yang punya bukti kehadiran + info fee guru & status invoice. Filter status opsional: review/done, filter search opsional: nama/email murid.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        status query string false "Filter status: review atau done"
// @Param        search query string false "Search by student name or email"
// @Success      200 {array} AdminListEvidenceResponse
// @Router       /admin/tutoring/evidence [get]
func (h *Handler) AdminListEvidence(c *fiber.Ctx) error {
	status := c.Query("status", "")
	if status != "" && status != "review" && status != "done" {
		return c.Status(400).JSON(ErrorResponse{Error: "status harus review atau done"})
	}
	search := c.Query("search", "")
	sessions, err := h.svc.ListEvidence(status, search)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	for i := range sessions {
		if sessions[i].EvidenceURL == "" || h.storage == nil {
			continue
		}
		if url, err := h.storage.URL(c.Context(), sessions[i].EvidenceURL, 24*time.Hour); err == nil {
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
// @Param        body body AdminReviewEvidenceRequest true "Aksi: approve atau reject"
// @Success      200 {object} AdminReviewEvidenceResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/evidence/{id} [patch]
func (h *Handler) AdminReviewEvidence(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input AdminReviewEvidenceRequest
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
		// hapus file storage DULU, kalau gagal, DB tidak diubah (sesi tetap
		// review, bukti masih ada) sehingga konsisten dan bisa di-retry.
		oldObject, err := h.svc.ValidateEvidenceReject(uint(id))
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		if h.storage != nil && oldObject != "" {
			if err := h.storage.Delete(c.Context(), oldObject); err != nil {
				return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus bukti: " + err.Error()})
			}
		}
		session, _, err := h.svc.RejectEvidence(uint(id))
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.JSON(session)
	default:
		return c.Status(400).JSON(ErrorResponse{Error: "action harus approve atau reject"})
	}
}

// CancelBooking membatalkan booking oleh murid pemiliknya
// @Summary      Cancel booking
// @Description  Murid membatalkan booking les privat miliknya sendiri. Bisa saat status pending (guru belum menyetujui) atau setelah disetujui selama invoice belum lunas.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Booking ID"
// @Success      200 {object} CancelBookingResponse
// @Failure      400 {object} ErrorResponse
// @Router       /tutoring/bookings/{id}/cancel [post]
func (h *Handler) CancelBooking(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	existing, err := h.svc.GetBooking(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "booking tidak ditemukan"})
	}
	userID := c.Locals("user_id").(uint)
	booking, err := h.svc.CancelBooking(existing.ID, userID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(booking)
}

// MyEarnings returns teacher's done sessions + fee estimate (teacher)
// @Summary      My earnings
// @Description  Riwayat sesi selesai milik guru + estimasi fee (persen dari harga sesi).
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} MyEarningsResponse
// @Router       /tutoring/earnings [get]
func (h *Handler) MyEarnings(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	userID := c.Locals("user_id").(uint)
	resp, err := h.svc.ListTeacherEarnings(userID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(resp)
}

// MarkEarningsTaken marks teacher's paid sessions as taken (bulk)
// @Summary      Tandai fee sudah diambil
// @Description  Guru menandai sesi yang feenya sudah dia ambil. Hanya sesi berstatus done dengan fee_paid = true yang diproses. Mengembalikan state earnings terbaru.
// @Tags         Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body MarkEarningsTakenRequest true "Sesi yang ditandai"
// @Success      200 {object} MyEarningsResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /tutoring/earnings/taken [patch]
func (h *Handler) MarkEarningsTaken(c *fiber.Ctx) error {
	if !hasRole(c, "teacher") && !hasRole(c, "admin") {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya untuk guru"})
	}
	var req MarkEarningsTakenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "body tidak valid"})
	}
	if len(req.SessionIDs) == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "session_ids wajib diisi"})
	}
	userID := c.Locals("user_id").(uint)
	resp, err := h.svc.MarkEarningsTaken(userID, req.SessionIDs, req.Taken)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal memperbarui data"})
	}
	return c.JSON(resp)
}

// AdminListReport returns per-booking session summary + refund estimate (admin only)
// @Summary      Tutoring session report
// @Description  Rekap jumlah pertemuan terlaksana/batal per booking + estimasi refund.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} AdminListReportResponse
// @Router       /admin/tutoring/report [get]
func (h *Handler) AdminListReport(c *fiber.Ctx) error {
	reports, err := h.svc.ListAdminSessionReport()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(reports)
}

// AdminListFees returns done sessions for teacher fee tracking (admin only)
// @Summary      List teacher fees
// @Description  Daftar sesi terlaksana dari booking yang sudah lunas, utk pencatatan fee guru.
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} AdminListFeesResponse
// @Router       /admin/tutoring/fees [get]
func (h *Handler) AdminListFees(c *fiber.Ctx) error {
	sessions, err := h.svc.ListTeacherFeeSessions()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	for i := range sessions {
		if sessions[i].EvidenceURL == "" || h.storage == nil {
			continue
		}
		if url, err := h.storage.URL(c.Context(), sessions[i].EvidenceURL, 24*time.Hour); err == nil {
			sessions[i].EvidenceURL = url
		}
	}
	return c.JSON(sessions)
}

// AdminToggleFeePaid toggles teacher fee payment status on a session (admin only)
// @Summary      Toggle fee paid
// @Description  Membalik status fee guru pada sesi (sudah/belum dibayar).
// @Tags         Admin Tutoring
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Session ID"
// @Success      200 {object} AdminToggleFeePaidResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/tutoring/fees/{id} [patch]
func (h *Handler) AdminToggleFeePaid(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	session, err := h.svc.ToggleSessionFeePaid(uint(id))
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(session)
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage, settings *setting.Service, notifSvc *notification.Service) {
	repo := NewRepository(db)
	svc := NewService(repo, db, settings)
	svc.SetNotificationService(notifSvc)
	h := NewHandler(svc, store)

	admin.Get("/tutoring/bookings", h.AdminListBookings)
	admin.Post("/tutoring/bookings", h.AdminCreateBooking)
	admin.Delete("/tutoring/bookings/:id", h.AdminDeleteBooking)
	admin.Patch("/tutoring/bookings/:id/assign", h.AssignTeacher)
	admin.Get("/tutoring/evidence", h.AdminListEvidence)
	admin.Patch("/tutoring/evidence/:id", h.AdminReviewEvidence)
	admin.Get("/tutoring/report", h.AdminListReport)
	admin.Get("/tutoring/fees", h.AdminListFees)
	admin.Patch("/tutoring/fees/:id", h.AdminToggleFeePaid)
}

func Routes(auth fiber.Router, db *gorm.DB, store *storage.ObjectStorage, settings *setting.Service, notifSvc *notification.Service) {
	repo := NewRepository(db)
	svc := NewService(repo, db, settings)
	svc.SetNotificationService(notifSvc)
	h := NewHandler(svc, store)

	auth.Get("/tutoring/teachers", h.ListTeachers)
	auth.Get("/tutoring/bookings", h.ListBookings)
	auth.Post("/tutoring/bookings", h.CreateBooking)
	auth.Post("/tutoring/bookings/:id/cancel", h.CancelBooking)
	auth.Get("/tutoring/sessions", h.ListSessions)
	auth.Get("/tutoring/earnings", h.MyEarnings)
	auth.Patch("/tutoring/earnings/taken", h.MarkEarningsTaken)
	auth.Patch("/tutoring/sessions/:id", h.UpdateSession)
	auth.Post("/tutoring/sessions/:id/cancel", h.CancelSession)
	auth.Post("/tutoring/sessions/:id/evidence", h.UploadSessionEvidence)
}
