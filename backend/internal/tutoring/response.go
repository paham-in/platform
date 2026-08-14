package tutoring

import "bimbel2/backend/internal/models"

// ErrorResponse adalah envelope error yang sama untuk semua handler.
type ErrorResponse struct {
	Error string `json:"error"`
}

// SubjectInfo dipakai di dalam ListTeachersResponse.
type SubjectInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func subjectInfos(subjects []models.Subject) []SubjectInfo {
	res := make([]SubjectInfo, len(subjects))
	for i, s := range subjects {
		res[i] = SubjectInfo{ID: s.ID, Name: s.Name}
	}
	return res
}

// bookingItem adalah bentuk internal hasil mapping models.Booking. Dipakai
// konstruktor response per handler supaya logika builder tetap satu sumber;
// bentuk & json tag sama dengan type response booking, jadi bisa dikonversi.
type bookingItem struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func buildBookingItem(b models.Booking) bookingItem {
	studentName := ""
	teacherName := ""
	subjectName := ""
	if b.Student != nil {
		studentName = b.Student.Name
	}
	if b.Teacher != nil {
		teacherName = b.Teacher.Name
	}
	if b.Subject != nil {
		subjectName = b.Subject.Name
	}
	invoiceStatus := ""
	if b.Invoice != nil {
		invoiceStatus = b.Invoice.Status
	}
	return bookingItem{
		ID:            b.ID,
		TeacherID:     b.TeacherID,
		Teacher:       teacherName,
		StudentID:     b.StudentID,
		Student:       studentName,
		SubjectID:     b.SubjectID,
		Subject:       subjectName,
		Date:          b.Date,
		StartTime:     b.StartTime,
		EndTime:       b.EndTime,
		Status:        b.Status,
		Mode:          b.Mode,
		SessionCount:  b.SessionCount,
		GroupToken:    b.GroupToken,
		Note:          b.Note,
		ClassID:       b.ClassID,
		CreatedAt:     b.CreatedAt.Format("2006-01-02"),
		InvoiceStatus: invoiceStatus,
	}
}

// sessionItem adalah bentuk internal hasil mapping models.TutoringSession.
// Sama seperti bookingItem: dipakai konstruktor response per handler.
type sessionItem struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func buildSessionItem(v models.TutoringSession) sessionItem {
	teacherName := ""
	studentName := ""
	mode := ""
	note := ""
	if v.Booking != nil {
		if v.Booking.Teacher != nil {
			teacherName = v.Booking.Teacher.Name
		}
		if v.Booking.Student != nil {
			studentName = v.Booking.Student.Name
		}
		mode = v.Booking.Mode
		note = v.Booking.Note
	}
	return sessionItem{
		ID:          v.ID,
		BookingID:   v.BookingID,
		Date:        v.Date,
		StartTime:   v.StartTime,
		EndTime:     v.EndTime,
		Status:      v.Status,
		StudentID:   v.Booking.StudentID,
		Teacher:     teacherName,
		Student:     studentName,
		Mode:        mode,
		Note:        note,
		EvidenceURL: v.EvidenceURL,
		FeePaid:     v.FeePaid,
	}
}

// — handler: ListTeachers (GET /tutoring/teachers) —

type ListTeachersResponse struct {
	ID        uint          `json:"id"`
	Name      string        `json:"name"`
	Email     string        `json:"email"`
	AvatarURL string        `json:"avatar_url"`
	Subjects  []SubjectInfo `json:"subjects"`
}

func newListTeachersResponse(u models.User) ListTeachersResponse {
	return ListTeachersResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		AvatarURL: u.AvatarURL,
		Subjects:  subjectInfos(u.Subjects),
	}
}

// — handler: ListBookings (GET /tutoring/bookings) —

type ListBookingsResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newListBookingsResponse(b models.Booking) ListBookingsResponse {
	return ListBookingsResponse(buildBookingItem(b))
}

// — handler: CreateBooking (POST /tutoring/bookings) —

type CreateBookingResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newCreateBookingResponse(b models.Booking) CreateBookingResponse {
	return CreateBookingResponse(buildBookingItem(b))
}

// — handler: AdminListBookings (GET /admin/tutoring/bookings) —

type AdminListBookingsResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newAdminListBookingsResponse(b models.Booking) AdminListBookingsResponse {
	return AdminListBookingsResponse(buildBookingItem(b))
}

// — handler: AdminCreateBooking (POST /admin/tutoring/bookings) —

type AdminCreateBookingResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newAdminCreateBookingResponse(b models.Booking) AdminCreateBookingResponse {
	return AdminCreateBookingResponse(buildBookingItem(b))
}

// — handler: AdminDeleteBooking (DELETE /admin/tutoring/bookings/:id) —

type AdminDeleteBookingResponse struct {
	Message string `json:"message"`
}

func newAdminDeleteBookingResponse() AdminDeleteBookingResponse {
	return AdminDeleteBookingResponse{Message: "booking berhasil dihapus"}
}

// — handler: AssignTeacher (PATCH /admin/tutoring/bookings/:id/assign) —

type AssignTeacherResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newAssignTeacherResponse(b models.Booking) AssignTeacherResponse {
	return AssignTeacherResponse(buildBookingItem(b))
}

// — handler: GroupInfo (GET /tutoring/groups/:token) —

type GroupInfoResponse struct {
	TeacherID    uint   `json:"teacher_id"`
	TeacherName  string `json:"teacher_name"`
	Mode         string `json:"mode"`
	SessionCount int    `json:"session_count"`
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Participants int    `json:"participants"`
	MaxSlots     int    `json:"max_slots"`
}

func newGroupInfoResponse(organizer models.Booking, participants int) GroupInfoResponse {
	teacherName := ""
	teacherID := uint(0)
	if organizer.TeacherID != nil {
		teacherID = *organizer.TeacherID
	}
	if organizer.Teacher != nil {
		teacherName = organizer.Teacher.Name
	}
	return GroupInfoResponse{
		TeacherID:    teacherID,
		TeacherName:  teacherName,
		Mode:         organizer.Mode,
		SessionCount: organizer.SessionCount,
		Date:         organizer.Date,
		StartTime:    organizer.StartTime,
		EndTime:      organizer.EndTime,
		Participants: participants,
		MaxSlots:     maxGroupSlots,
	}
}

// — handler: ListSessions (GET /tutoring/sessions) —

type ListSessionsResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newListSessionsResponse(v models.TutoringSession) ListSessionsResponse {
	return ListSessionsResponse(buildSessionItem(v))
}

// — handler: UpdateSession (PATCH /tutoring/sessions/:id) —

type UpdateSessionResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newUpdateSessionResponse(v models.TutoringSession) UpdateSessionResponse {
	return UpdateSessionResponse(buildSessionItem(v))
}

// — handler: CancelSession (POST /tutoring/sessions/:id/cancel) —

type CancelSessionResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newCancelSessionResponse(v models.TutoringSession) CancelSessionResponse {
	return CancelSessionResponse(buildSessionItem(v))
}

// — handler: UploadSessionEvidence (POST /tutoring/sessions/:id/evidence) —

type UploadSessionEvidenceResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newUploadSessionEvidenceResponse(v models.TutoringSession) UploadSessionEvidenceResponse {
	return UploadSessionEvidenceResponse(buildSessionItem(v))
}

// — handler: AdminListEvidence (GET /admin/tutoring/evidence) —

type AdminListEvidenceResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newAdminListEvidenceResponse(v models.TutoringSession) AdminListEvidenceResponse {
	return AdminListEvidenceResponse(buildSessionItem(v))
}

// — handler: AdminReviewEvidence (PATCH /admin/tutoring/evidence/:id) —

type AdminReviewEvidenceResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newAdminReviewEvidenceResponse(v models.TutoringSession) AdminReviewEvidenceResponse {
	return AdminReviewEvidenceResponse(buildSessionItem(v))
}

// — handler: UpdateBookingStatus (PATCH /tutoring/bookings/:id) —

type UpdateBookingStatusResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newUpdateBookingStatusResponse(b models.Booking) UpdateBookingStatusResponse {
	return UpdateBookingStatusResponse(buildBookingItem(b))
}

// — handler: CancelBooking (POST /tutoring/bookings/:id/cancel) —

type CancelBookingResponse struct {
	ID            uint   `json:"id"`
	TeacherID     *uint  `json:"teacher_id,omitempty"`
	Teacher       string `json:"teacher_name"`
	StudentID     uint   `json:"student_id"`
	Student       string `json:"student_name"`
	SubjectID     uint   `json:"subject_id"`
	Subject       string `json:"subject_name"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	Mode          string `json:"mode"`
	SessionCount  int    `json:"session_count"`
	GroupToken    string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

func newCancelBookingResponse(b models.Booking) CancelBookingResponse {
	return CancelBookingResponse(buildBookingItem(b))
}

// — handler: MyEarnings (GET /tutoring/earnings) —
// Sessions memakai bentuk ListSessionsResponse (item sesi di-reuse antar handler).

type MyEarningsResponse struct {
	TotalSessions  int                    `json:"total_sessions"`
	TotalFee       float64                `json:"total_fee"`
	FeePaidTotal   float64                `json:"fee_paid_total"`
	FeeUnpaidTotal float64                `json:"fee_unpaid_total"`
	Sessions       []ListSessionsResponse `json:"sessions"`
}

func (s *Service) newMyEarningsResponse(sessions []models.TutoringSession) MyEarningsResponse {
	resp := MyEarningsResponse{}
	for _, v := range sessions {
		if v.Status != "done" || v.Booking == nil {
			continue
		}
		perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
		fee := s.sessionFee(perSession)
		sv := ListSessionsResponse(buildSessionItem(v))
		sv.FeeAmount = fee
		resp.Sessions = append(resp.Sessions, sv)
		resp.TotalSessions++
		resp.TotalFee += fee
		if v.FeePaid {
			resp.FeePaidTotal += fee
		} else {
			resp.FeeUnpaidTotal += fee
		}
	}
	return resp
}

// — handler: AdminListReport (GET /admin/tutoring/report) —

type AdminListReportResponse struct {
	BookingID       uint    `json:"booking_id"`
	StudentID       uint    `json:"student_id"`
	Teacher         string  `json:"teacher_name"`
	Student         string  `json:"student_name"`
	Mode            string  `json:"mode"`
	SessionCount    int     `json:"session_count"`
	DoneCount       int     `json:"done_count"`
	CancelledCount  int     `json:"cancelled_count"`
	ScheduledCount  int     `json:"scheduled_count"`
	PricePerSession float64 `json:"price_per_session"`
	FeePerSession   float64 `json:"fee_per_session"`
	FeeUnpaidTotal  float64 `json:"fee_unpaid_total"`
	RefundAmount    float64 `json:"refund_amount"`
	InvoiceStatus   string  `json:"invoice_status"`
}

func (s *Service) newAdminListReportResponse(b models.Booking) AdminListReportResponse {
	perSession := s.perSessionPrice(b.ClassID, b.Mode)
	rep := AdminListReportResponse{
		BookingID:       b.ID,
		StudentID:       b.StudentID,
		Mode:            b.Mode,
		SessionCount:    b.SessionCount,
		PricePerSession: perSession,
		FeePerSession:   s.sessionFee(perSession),
		InvoiceStatus:   "pending",
	}
	if b.Teacher != nil {
		rep.Teacher = b.Teacher.Name
	}
	if b.Student != nil {
		rep.Student = b.Student.Name
	}
	if b.Invoice != nil {
		rep.InvoiceStatus = b.Invoice.Status
	}
	for _, sess := range b.Sessions {
		switch sess.Status {
		case "done":
			rep.DoneCount++
			if !sess.FeePaid {
				rep.FeeUnpaidTotal += rep.FeePerSession
			}
		case "cancelled":
			rep.CancelledCount++
		case "scheduled", "review":
			rep.ScheduledCount++
		}
	}
	rep.RefundAmount = float64(rep.CancelledCount) * perSession
	return rep
}

// — handler: AdminListFees (GET /admin/tutoring/fees) —

type AdminListFeesResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newAdminListFeesResponse(v models.TutoringSession) AdminListFeesResponse {
	return AdminListFeesResponse(buildSessionItem(v))
}

// — handler: AdminToggleFeePaid (PATCH /admin/tutoring/fees/:id) —

type AdminToggleFeePaidResponse struct {
	ID          uint    `json:"id"`
	BookingID   uint    `json:"booking_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Status      string  `json:"status"`
	StudentID   uint    `json:"student_id"`
	Teacher     string  `json:"teacher_name"`
	Student     string  `json:"student_name"`
	Mode        string  `json:"mode"`
	Note        string  `json:"note"`
	EvidenceURL string  `json:"evidence_url,omitempty"`
	FeePaid     bool    `json:"fee_paid,omitempty"`
	FeeAmount   float64 `json:"fee_amount,omitempty"`
	InvoicePaid bool    `json:"invoice_paid,omitempty"`
}

func newAdminToggleFeePaidResponse(v models.TutoringSession) AdminToggleFeePaidResponse {
	return AdminToggleFeePaidResponse(buildSessionItem(v))
}
