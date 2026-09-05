package tutoring

//, handler: ListTeachers (GET /tutoring/teachers), query filter, bukan body

type ListTeachersRequest struct {
	SubjectID *uint
	Date      string // "YYYY-MM-DD", jika diisi, hanya guru yang bebas di tanggal ini
	StartTime string
	EndTime   string
}

//, handler: CreateBooking (POST /tutoring/bookings)

type CreateBookingRequest struct {
	TeacherID    *uint    `json:"teacher_id"` // nil = belum ada guru, ditangani admin
	SubjectID    uint     `json:"subject_id"` // mapel yang murid mau (wajib)
	Date         string   `json:"date"`
	StartTime    string   `json:"start_time"`
	EndTime      string   `json:"end_time"`
	Mode         string   `json:"mode"`          // private/group
	SessionCount int      `json:"session_count"` // jumlah pertemuan (default 1)
	Note         string   `json:"note"`
	ClassID      *uint    `json:"class_id,omitempty"`
	MemberEmails []string `json:"member_emails"` // group: email member (wajib ≥1)
}

//, handler: AdminCreateBooking (POST /admin/tutoring/bookings)

type AdminCreateBookingRequest struct {
	StudentID    uint     `json:"student_id"`
	TeacherID    uint     `json:"teacher_id"`
	SubjectID    uint     `json:"subject_id"`
	Date         string   `json:"date"`
	StartTime    string   `json:"start_time"`
	EndTime      string   `json:"end_time"`
	Mode         string   `json:"mode"`          // private/group
	SessionCount int      `json:"session_count"` // jumlah pertemuan (default 1)
	Note         string   `json:"note"`
	ClassID      *uint    `json:"class_id,omitempty"`
	MemberEmails []string `json:"member_emails"` // group: email member (wajib ≥1)
}

//, handler: RescheduleBooking (PATCH /tutoring/bookings/:id/schedule)
//, handler: AdminRescheduleBooking (PATCH /admin/tutoring/bookings/:id/schedule)

type RescheduleBookingRequest struct {
	Date      string `json:"date"`       // "YYYY-MM-DD"
	StartTime string `json:"start_time"` // "HH:mm"
	EndTime   string `json:"end_time"`   // "HH:mm"
}

//, handler: ReportOvertime (PATCH /tutoring/sessions/:id/overtime)

type ReportOvertimeRequest struct {
	ActualEndTime string `json:"actual_end_time"` // jam selesai aktual ("HH:mm")
}

//, handler: AssignTeacher (PATCH /admin/tutoring/bookings/:id/assign)

type AssignTeacherRequest struct {
	TeacherID uint `json:"teacher_id"`
}

//, handler: UpdateSession (PATCH /tutoring/sessions/:id)

type UpdateSessionRequest struct {
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

//, handler: AdminReviewEvidence (PATCH /admin/tutoring/evidence/:id)

type AdminReviewEvidenceRequest struct {
	Action string `json:"action"` // approve/reject
}

//, handler: MarkEarningsTaken (PATCH /tutoring/earnings/taken)

type MarkEarningsTakenRequest struct {
	SessionIDs []uint `json:"session_ids"` // sesi yang ditandai
	Taken      bool   `json:"taken"`       // true = sudah diambil, false = batalkan
}
