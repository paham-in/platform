package tutoring

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/setting"

	"gorm.io/gorm"
)

const maxGroupSlots = 5

type AvailabilityResponse struct {
	ID        uint   `json:"id"`
	TeacherID uint   `json:"teacher_id"`
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type BookingResponse struct {
	ID           uint   `json:"id"`
	TeacherID    *uint  `json:"teacher_id,omitempty"`
	Teacher      string `json:"teacher_name"`
	StudentID    uint   `json:"student_id"`
	Student      string `json:"student_name"`
	SubjectID    uint   `json:"subject_id"`
	Subject      string `json:"subject_name"`
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Status       string `json:"status"`
	Mode         string `json:"mode"`
	SessionCount int    `json:"session_count"`
	GroupToken   string `json:"group_token"`
	Note          string `json:"note"`
	ClassID       *uint  `json:"class_id,omitempty"`
	CreatedAt     string `json:"created_at"`
	InvoiceStatus string `json:"invoice_status,omitempty"`
}

type TutoringSessionResponse struct {
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

type TeacherResponse struct {
	ID        uint                   `json:"id"`
	Name      string                 `json:"name"`
	Email     string                 `json:"email"`
	AvatarURL string                 `json:"avatar_url"`
	Subjects  []SubjectInfo          `json:"subjects"`
	Slots     []AvailabilityResponse `json:"slots,omitempty"`
}

type TeacherFilter struct {
	SubjectID *uint
	DayOfWeek *int
	StartTime string
	EndTime   string
}

type SubjectInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type Service struct {
	repo     *Repository
	db       *gorm.DB
	settings *setting.Service
}

func NewService(repo *Repository, db *gorm.DB, settings *setting.Service) *Service {
	return &Service{repo: repo, db: db, settings: settings}
}

// sessionFee menghitung fee guru utk satu sesi: persentase dari harga sesi.
func (s *Service) sessionFee(price float64) float64 {
	return price * s.settings.TeacherFeePercent() / 100
}

func (s *Service) ListAvailability(teacherID uint) ([]AvailabilityResponse, error) {
	slots, err := s.repo.ListAvailability(teacherID)
	if err != nil {
		return nil, err
	}
	res := make([]AvailabilityResponse, len(slots))
	for i, v := range slots {
		res[i] = AvailabilityResponse{ID: v.ID, TeacherID: v.TeacherID, DayOfWeek: v.DayOfWeek, StartTime: v.StartTime, EndTime: v.EndTime}
	}
	return res, nil
}

type CreateAvailabilityInput struct {
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

func (s *Service) CreateAvailability(teacherID uint, input CreateAvailabilityInput) (*AvailabilityResponse, error) {
	if input.DayOfWeek < 0 || input.DayOfWeek > 6 {
		return nil, errors.New("day_of_week harus 0-6")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	slot := models.Availability{
		TeacherID: teacherID,
		DayOfWeek: input.DayOfWeek,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
	}
	if err := s.repo.CreateAvailability(&slot); err != nil {
		return nil, err
	}
	return &AvailabilityResponse{ID: slot.ID, TeacherID: slot.TeacherID, DayOfWeek: slot.DayOfWeek, StartTime: slot.StartTime, EndTime: slot.EndTime}, nil
}

func (s *Service) DeleteAvailability(id, teacherID uint) error {
	return s.repo.DeleteAvailability(id, teacherID)
}

func (s *Service) ListTeachers(filter TeacherFilter) ([]TeacherResponse, error) {
	var users []models.User
	var err error
	if filter.SubjectID != nil {
		users, err = s.repo.ListTeachersBySubject(*filter.SubjectID)
	} else {
		users, err = s.repo.ListTeachers()
	}
	if err != nil {
		return nil, err
	}

	res := make([]TeacherResponse, 0, len(users))
	for _, u := range users {
		subjects := make([]SubjectInfo, len(u.Subjects))
		for j, subj := range u.Subjects {
			subjects[j] = SubjectInfo{ID: subj.ID, Name: subj.Name}
		}
		t := TeacherResponse{ID: u.ID, Name: u.Name, Email: u.Email, AvatarURL: u.AvatarURL, Subjects: subjects}

		// slot filter: hanya guru yang punya availability contain request.
		if filter.DayOfWeek != nil || filter.StartTime != "" || filter.EndTime != "" {
			slots, err := s.repo.ListAvailability(u.ID)
			if err != nil {
				continue
			}
			matched := make([]AvailabilityResponse, 0, len(slots))
			for _, slot := range slots {
				if filter.DayOfWeek != nil && slot.DayOfWeek != *filter.DayOfWeek {
					continue
				}
				if filter.StartTime != "" && slot.StartTime > filter.StartTime {
					continue
				}
				if filter.EndTime != "" && slot.EndTime < filter.EndTime {
					continue
				}
				matched = append(matched, AvailabilityResponse{ID: slot.ID, TeacherID: slot.TeacherID, DayOfWeek: slot.DayOfWeek, StartTime: slot.StartTime, EndTime: slot.EndTime})
			}
			if len(matched) == 0 {
				continue // guru tanpa slot yang cocok
			}
			t.Slots = matched
		}
		res = append(res, t)
	}
	return res, nil
}

func (s *Service) ListAllBookings() ([]BookingResponse, error) {
	bookings, err := s.repo.ListAllBookings()
	if err != nil {
		return nil, err
	}
	return toBookingResponses(bookings), nil
}

func (s *Service) ListTeacherBookings(teacherID uint) ([]BookingResponse, error) {
	bookings, err := s.repo.ListBookingsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	return toBookingResponses(bookings), nil
}

func (s *Service) ListMyBookings(studentID uint) ([]BookingResponse, error) {
	bookings, err := s.repo.ListBookingsByStudent(studentID)
	if err != nil {
		return nil, err
	}
	return toBookingResponses(bookings), nil
}

type CreateBookingInput struct {
	TeacherID    *uint  `json:"teacher_id"` // nil = belum ada guru, ditangani admin
	SubjectID    uint   `json:"subject_id"` // mapel yang murid mau (wajib)
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Mode         string `json:"mode"`          // private/semi_private
	SessionCount int    `json:"session_count"` // jumlah pertemuan (default 1)
	GroupToken   string `json:"group_token"`   // isi utk join grup yang sudah ada
	Note         string `json:"note"`
	ClassID      *uint  `json:"class_id,omitempty"`
}

type AssignTeacherInput struct {
	TeacherID uint `json:"teacher_id"`
}

type AdminCreateBookingInput struct {
	StudentID    uint   `json:"student_id"`
	TeacherID    uint   `json:"teacher_id"`
	SubjectID    uint   `json:"subject_id"`
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Mode         string `json:"mode"`          // private/semi_private
	SessionCount int    `json:"session_count"` // jumlah pertemuan (default 1)
	Note         string `json:"note"`
	ClassID      *uint  `json:"class_id,omitempty"`
}

func (s *Service) CreateBooking(studentID uint, input CreateBookingInput) (*BookingResponse, error) {
	if input.Mode == "" {
		input.Mode = "private"
	}
	if input.Mode != "private" && input.Mode != "semi_private" {
		return nil, errors.New("mode harus private atau semi_private")
	}
	if input.SessionCount < 1 {
		input.SessionCount = 1
	}
	if input.SessionCount > 52 {
		return nil, errors.New("session_count maksimal 52")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}

	if input.GroupToken != "" {
		return s.joinGroup(studentID, input)
	}
	return s.createOrganizer(studentID, input)
}

func (s *Service) createOrganizer(studentID uint, input CreateBookingInput) (*BookingResponse, error) {
	// kelas booking wajib diisi — ambil dari langganan aktif kalau tidak dikirim
	if input.ClassID == nil {
		classID, err := s.resolveStudentClassID(studentID)
		if err != nil {
			return nil, err
		}
		input.ClassID = classID
	}

	// mapel wajib + harus satu program dengan kelas murid
	if input.SubjectID == 0 {
		return nil, errors.New("pilih mata pelajaran dulu")
	}
	if err := s.validateSubjectProgram(input.SubjectID, *input.ClassID); err != nil {
		return nil, err
	}

	// booking tanpa guru → diserahkan ke admin
	if input.TeacherID == nil {
		return s.createNoTeacherBooking(studentID, input)
	}

	// validasi slot sesuai jadwal kosong guru
	if err := s.validateAvailability(*input.TeacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}
	// cek konflik jadwal guru
	if err := s.checkTeacherConflict(*input.TeacherID, input.Date, input.StartTime, input.EndTime, ""); err != nil {
		return nil, err
	}

	token := ""
	if input.Mode == "semi_private" {
		t, err := generateToken()
		if err != nil {
			return nil, errors.New("gagal membuat token grup")
		}
		token = t
	}

	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}
	booking := models.Booking{
		TeacherID:    input.TeacherID,
		StudentID:    studentID,
		SubjectID:    input.SubjectID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "pending",
		Mode:         input.Mode,
		SessionCount: total,
		GroupToken:   token,
		Note:         input.Note,
		ClassID:      input.ClassID,
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*created)
	return &r, nil
}

// createNoTeacherBooking membuat booking tanpa guru untuk diproses admin.
// Semi-private butuh guru (grup berbagi jadwal), jadi ditolak.
func (s *Service) createNoTeacherBooking(studentID uint, input CreateBookingInput) (*BookingResponse, error) {
	if input.Mode == "semi_private" {
		return nil, errors.New("semi-private butuh guru — pilih guru dari daftar")
	}
	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}
	booking := models.Booking{
		TeacherID:    nil,
		StudentID:    studentID,
		SubjectID:    input.SubjectID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "pending",
		Mode:         "private",
		SessionCount: total,
		Note:         input.Note,
		ClassID:      input.ClassID,
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*created)
	return &r, nil
}

// validateSubjectProgram memastikan mapel satu program dengan kelas murid.
func (s *Service) validateSubjectProgram(subjectID, classID uint) error {
	var subject models.Subject
	if err := s.repo.db.First(&subject, subjectID).Error; err != nil {
		return errors.New("mata pelajaran tidak ditemukan")
	}
	var class models.Class
	if err := s.repo.db.First(&class, classID).Error; err != nil {
		return errors.New("kelas tidak ditemukan")
	}
	if subject.ProgramID != nil && class.ProgramID != nil && *subject.ProgramID != *class.ProgramID {
		return errors.New("mata pelajaran tidak sesuai dengan kelas kamu")
	}
	return nil
}

// AdminCreateBooking daftarkan les privat manual atas nama murid.
// Langsung status confirmed + generate sesi & invoice (admin tinggal tandai lunas).
// Semua write (booking + sesi + invoice) dalam satu transaksi — atomicity.
func (s *Service) AdminCreateBooking(input AdminCreateBookingInput) (*BookingResponse, error) {
	if input.Mode == "" {
		input.Mode = "private"
	}
	if input.Mode != "private" && input.Mode != "semi_private" {
		return nil, errors.New("mode harus private atau semi_private")
	}
	if input.SessionCount < 1 {
		input.SessionCount = 1
	}
	if input.SessionCount > 52 {
		return nil, errors.New("session_count maksimal 52")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	if err := s.validateAvailability(input.TeacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}
	if err := s.checkTeacherConflict(input.TeacherID, input.Date, input.StartTime, input.EndTime, ""); err != nil {
		return nil, err
	}

	// kelas booking wajib diisi — ambil dari langganan aktif kalau tidak dikirim
	if input.ClassID == nil {
		classID, err := s.resolveStudentClassID(input.StudentID)
		if err != nil {
			return nil, err
		}
		input.ClassID = classID
	}

	if input.SubjectID == 0 {
		return nil, errors.New("subject_id wajib diisi")
	}
	if err := s.validateSubjectProgram(input.SubjectID, *input.ClassID); err != nil {
		return nil, err
	}

	// input.SessionCount = jumlah minggu → total sesi = minggu × sesi-per-minggu
	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}
	input.SessionCount = total

	var resp *BookingResponse
	err = s.db.Transaction(func(tx *gorm.DB) error {
		booking := models.Booking{
			TeacherID:    &input.TeacherID,
			StudentID:    input.StudentID,
			SubjectID:    input.SubjectID,
			Date:         input.Date,
			StartTime:    input.StartTime,
			EndTime:      input.EndTime,
			Status:       "confirmed",
			Mode:         input.Mode,
			SessionCount: input.SessionCount,
			Note:         input.Note,
			ClassID:      input.ClassID,
		}
		if err := tx.Create(&booking).Error; err != nil {
			return err
		}

		// sesi + invoice (dalam tx)
		if err := s.createSessionsAndInvoice(tx, booking); err != nil {
			return err
		}

		// baca via tx — s.repo.GetBooking (s.db) tidak terlihat row yg belum commit
		created, err := s.repo.GetBookingWithDB(tx, booking.ID)
		if err != nil {
			return err
		}
		r := toBookingResponse(*created)
		resp = &r
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// AdminDeleteBooking menghapus booking beserta sesi & invoice terkait (admin).
// Dipakai utk koreksi booking manual yang salah input. Booking yang invoice-nya
// sudah lunas ditolak — riwayat pembayaran tidak boleh hilang.
func (s *Service) AdminDeleteBooking(id uint) error {
	if _, err := s.repo.GetBooking(id); err != nil {
		return errors.New("booking tidak ditemukan")
	}
	var paid models.Invoice
	if err := s.repo.db.Where("booking_id = ? AND status = ?", id, "paid").First(&paid).Error; err == nil {
		return errors.New("booking sudah punya invoice lunas — tidak bisa dihapus")
	}
	return s.repo.DeleteBookingCascade(id)
}

func (s *Service) joinGroup(studentID uint, input CreateBookingInput) (*BookingResponse, error) {
	organizer, err := s.repo.GetBookingByToken(input.GroupToken)
	if err != nil {
		return nil, errors.New("grup tidak ditemukan")
	}
	if organizer.Status == "rejected" || organizer.Status == "cancelled" {
		return nil, errors.New("grup sudah tidak aktif")
	}
	if organizer.StudentID == studentID {
		return nil, errors.New("kamu sudah menjadi organizer grup ini")
	}

	existing, err := s.repo.ListBookingsByGroupToken(input.GroupToken)
	if err != nil {
		return nil, err
	}
	for _, b := range existing {
		if b.StudentID == studentID {
			return nil, errors.New("kamu sudah bergabung ke grup ini")
		}
	}

	count, err := s.repo.CountGroupParticipants(input.GroupToken)
	if err != nil {
		return nil, err
	}
	if count >= maxGroupSlots {
		return nil, errors.New("grup sudah penuh (maks 5 siswa)")
	}

	// peserta wajib memakai slot yang sama dgn organizer
	if organizer.TeacherID == nil || input.TeacherID == nil ||
		*organizer.TeacherID != *input.TeacherID ||
		organizer.Date != input.Date ||
		organizer.StartTime != input.StartTime ||
		organizer.EndTime != input.EndTime {
		return nil, errors.New("data booking harus sama dengan grup (guru, tanggal, jam)")
	}

	booking := models.Booking{
		TeacherID:    organizer.TeacherID,
		StudentID:    studentID,
		SubjectID:    organizer.SubjectID,
		Date:         organizer.Date,
		StartTime:    organizer.StartTime,
		EndTime:      organizer.EndTime,
		Status:       "pending",
		Mode:         organizer.Mode,
		SessionCount: organizer.SessionCount,
		GroupToken:   organizer.GroupToken,
		Note:         input.Note,
		ClassID:      organizer.ClassID,
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*created)
	return &r, nil
}

// validateAvailability memastikan (tanggal, jam) masuk dalam slot kosong guru.
func (s *Service) validateAvailability(teacherID uint, date, startTime, endTime string) error {
	dateObj, err := time.Parse("2006-01-02", date)
	if err != nil {
		return errors.New("format tanggal tidak valid")
	}
	weekday := int(dateObj.Weekday())
	slots, err := s.repo.ListAvailability(teacherID)
	if err != nil {
		return err
	}
	for _, slot := range slots {
		if slot.DayOfWeek == weekday && slot.StartTime <= startTime && slot.EndTime >= endTime {
			return nil
		}
	}
	return errors.New("jadwal tidak tersedia untuk slot waktu tersebut")
}

// checkTeacherConflict memblokir booking yang bentrok dgn booking guru lain.
// excludeToken dipakai utk mengabaikan booking dalam grup yang sama.
func (s *Service) checkTeacherConflict(teacherID uint, date, startTime, endTime, excludeToken string) error {
	newStart, _ := timeToMinutes(startTime)
	newEnd, _ := timeToMinutes(endTime)
	existing, err := s.repo.ListBookingsByTeacherAndDate(teacherID, date, []string{"confirmed", "pending"})
	if err != nil {
		return err
	}
	for _, b := range existing {
		if excludeToken != "" && b.GroupToken == excludeToken {
			continue
		}
		bStart, err1 := timeToMinutes(b.StartTime)
		bEnd, err2 := timeToMinutes(b.EndTime)
		if err1 != nil || err2 != nil {
			continue
		}
		if hasOverlap(newStart, newEnd, bStart, bEnd) {
			return errors.New("guru sudah memiliki booking pada jam tersebut")
		}
	}
	return nil
}

// timeToMinutes mengubah "HH:mm" menjadi menit sejak tengah malam.
func timeToMinutes(t string) (int, error) {
	parsed, err := time.Parse("15:04", t)
	if err != nil {
		return 0, err
	}
	return parsed.Hour()*60 + parsed.Minute(), nil
}

// minutesToHHMM mengubah menit sejak tengah malam menjadi "HH:mm".
func minutesToHHMM(min int) string {
	return fmt.Sprintf("%02d:%02d", min/60, min%60)
}

// sessionDurationMinutes adalah durasi standar 1 sesi les.
const sessionDurationMinutes = 90

// sessionsPerWeekFor menghitung jumlah sesi 90-menit dalam satu blok (start..end).
// Durasi harus kelipatan 90 — kalau tidak, tolak.
func sessionsPerWeekFor(start, end string) (int, error) {
	s, err := timeToMinutes(start)
	if err != nil {
		return 0, errors.New("format jam mulai tidak valid")
	}
	e, err := timeToMinutes(end)
	if err != nil {
		return 0, errors.New("format jam selesai tidak valid")
	}
	dur := e - s
	if dur <= 0 {
		return 0, errors.New("start_time harus sebelum end_time")
	}
	if dur%sessionDurationMinutes != 0 {
		return 0, fmt.Errorf("durasi les harus kelipatan %d menit (%d jam)", sessionDurationMinutes, sessionDurationMinutes/60)
	}
	return dur / sessionDurationMinutes, nil
}

// hasOverlap mengembalikan true jika dua interval waktu saling tumpang tindih.
func hasOverlap(start1, end1, start2, end2 int) bool {
	return start1 < end2 && start2 < end1
}

func (s *Service) UpdateBookingStatus(id, teacherID uint, status string) (*BookingResponse, error) {
	valid := map[string]bool{"confirmed": true, "rejected": true}
	if !valid[status] {
		return nil, errors.New("status harus confirmed atau rejected")
	}

	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.TeacherID == nil {
		return nil, errors.New("booking belum punya guru — ditangani admin")
	}
	if *booking.TeacherID != teacherID {
		return nil, errors.New("hanya guru terkait yang bisa mengubah status")
	}
	if booking.Status != "pending" {
		return nil, errors.New("booking sudah diproses sebelumnya")
	}

	// kalau booking grup, status berlaku utk semua anggota ber-token sama
	targets := []models.Booking{*booking}
	if booking.GroupToken != "" {
		group, err := s.repo.ListBookingsByGroupToken(booking.GroupToken)
		if err != nil {
			return nil, err
		}
		targets = group
	}

	if status == "rejected" {
		for _, b := range targets {
			if b.Status == "pending" {
				if err := s.repo.UpdateBookingStatus(b.ID, "rejected"); err != nil {
					return nil, err
				}
			}
		}
	} else {
		for _, b := range targets {
			if b.Status == "pending" {
				if err := s.repo.UpdateBookingStatus(b.ID, "confirmed"); err != nil {
					return nil, err
				}
				if err := s.createSessionsAndInvoice(s.db, b); err != nil {
					return nil, err
				}
			}
		}
	}

	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*updated)
	return &r, nil
}

// AssignTeacher menetapkan guru ke booking tanpa guru (admin). Status tetap pending,
// guru yang dipilih lalu approve sendiri. Validasi slot + konflik jadwal.
func (s *Service) AssignTeacher(id, teacherID uint) (*BookingResponse, error) {
	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.TeacherID != nil {
		return nil, errors.New("booking sudah punya guru")
	}
	if booking.Status != "pending" {
		return nil, errors.New("booking sudah diproses sebelumnya")
	}
	if err := s.validateAvailability(teacherID, booking.Date, booking.StartTime, booking.EndTime); err != nil {
		return nil, err
	}
	if err := s.checkTeacherConflict(teacherID, booking.Date, booking.StartTime, booking.EndTime, ""); err != nil {
		return nil, err
	}
	if err := s.repo.UpdateBookingTeacher(id, teacherID); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*updated)
	return &r, nil
}

// resolveStudentClassID mengambil class_id dari langganan aktif student
// (student_classes). 0 langganan → error; 1 → langsung dipakai; >1 → minta pilih.
func (s *Service) resolveStudentClassID(studentID uint) (*uint, error) {
	today := time.Now().Format("2006-01-02")
	var ids []uint
	if err := s.repo.db.Model(&models.StudentClass{}).
		Where("user_id = ? AND expiry >= ?", studentID, today).
		Distinct("class_id").Order("class_id asc").Pluck("class_id", &ids).Error; err != nil {
		return nil, err
	}
	switch len(ids) {
	case 0:
		return nil, errors.New("kamu belum punya akses kelas — hubungi admin")
	case 1:
		return &ids[0], nil
	default:
		return nil, errors.New("pilih kelas dulu sebelum booking")
	}
}

// getClassPrices mengembalikan harga les privat per kelas.
// Kelas tidak ditemukan / belum diisi harga → 0.
func (s *Service) getClassPrices(classID *uint) (price, semiPrice float64) {
	if classID == nil {
		return 0, 0
	}
	var class models.Class
	if err := s.repo.db.First(&class, *classID).Error; err != nil {
		return 0, 0
	}
	return class.PricePerSession, class.SemiPrivatePrice
}

// perSessionPrice menghitung harga per pertemuan utk mode tertentu.
// Admin diharapkan mengisi harga tiap kelas; kelas tanpa harga → 0.
func (s *Service) perSessionPrice(classID *uint, mode string) float64 {
	price, semiPrice := s.getClassPrices(classID)
	if mode == "semi_private" {
		return semiPrice
	}
	return price
}

// createSessionsAndInvoice membuat sesi pertemuan mingguan + invoice pembayaran.
// db dipakai agar bisa dijalankan dalam transaksi (tx) atau langsung (s.db).
func (s *Service) createSessionsAndInvoice(db *gorm.DB, booking models.Booking) error {
	date, err := time.Parse("2006-01-02", booking.Date)
	if err != nil {
		return errors.New("tanggal booking tidak valid")
	}

	// booking.SessionCount = total sesi. Durasi blok (Start..End) dipecah jadi sesi
	// 90-menit back-to-back per minggu; jumlah minggu = total / perWeek (harus bulat).
	perWeek, err := sessionsPerWeekFor(booking.StartTime, booking.EndTime)
	if err != nil {
		return err
	}
	if booking.SessionCount%perWeek != 0 {
		return fmt.Errorf("jumlah pertemuan harus kelipatan %d sesi/minggu", perWeek)
	}
	weeks := booking.SessionCount / perWeek
	startMin, _ := timeToMinutes(booking.StartTime)

	sessions := make([]models.TutoringSession, 0, booking.SessionCount)
	startDate := date
	endDate := date
	for w := 0; w < weeks; w++ {
		d := date.AddDate(0, 0, 7*w)
		if w == 0 {
			startDate = d
		}
		endDate = d
		for j := 0; j < perWeek; j++ {
			ss := startMin + j*sessionDurationMinutes
			se := ss + sessionDurationMinutes
			sessions = append(sessions, models.TutoringSession{
				BookingID: booking.ID,
				Date:      d.Format("2006-01-02"),
				StartTime: minutesToHHMM(ss),
				EndTime:   minutesToHHMM(se),
				Status:    "scheduled",
			})
		}
	}
	if err := db.Create(&sessions).Error; err != nil {
		return err
	}

	modeLabel := "private"
	if booking.Mode == "semi_private" {
		modeLabel = "semi-private"
	}
	perSession := s.perSessionPrice(booking.ClassID, booking.Mode)
	invoice := models.Invoice{
		UserID:    booking.StudentID,
		Amount:    perSession * float64(booking.SessionCount),
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.AddDate(0, 0, 7).Format("2006-01-02"), // sesi terakhir + 7 hari akses
		Status:    "pending",
		Note:      fmt.Sprintf("Les %s — %d sesi", modeLabel, booking.SessionCount),
		BookingID: &booking.ID,
		ClassID:   booking.ClassID, // grant StudentClass saat invoice lunas
	}
	return db.Create(&invoice).Error
}

// sessionCountForTotal menghitung total sesi = minggu × sesi-per-minggu, dan
// memvalidasi durasi blok kelipatan durasi-sesi.
func sessionCountForTotal(weeks int, start, end string) (int, error) {
	perWeek, err := sessionsPerWeekFor(start, end)
	if err != nil {
		return 0, err
	}
	return weeks * perWeek, nil
}

func (s *Service) ListGroupInfo(token string) (*GroupInfoResponse, error) {
	organizer, err := s.repo.GetBookingByToken(token)
	if err != nil {
		return nil, errors.New("grup tidak ditemukan")
	}
	count, err := s.repo.CountGroupParticipants(token)
	if err != nil {
		return nil, err
	}
	teacherName := ""
	teacherID := uint(0)
	if organizer.TeacherID != nil {
		teacherID = *organizer.TeacherID
	}
	if organizer.Teacher != nil {
		teacherName = organizer.Teacher.Name
	}
	return &GroupInfoResponse{
		TeacherID:    teacherID,
		TeacherName:  teacherName,
		Mode:         organizer.Mode,
		SessionCount: organizer.SessionCount,
		Date:         organizer.Date,
		StartTime:    organizer.StartTime,
		EndTime:      organizer.EndTime,
		Participants: int(count),
		MaxSlots:     maxGroupSlots,
	}, nil
}

// ListTeacherSessions mengembalikan semua sesi pertemuan milik guru.
func (s *Service) ListTeacherSessions(teacherID uint) ([]TutoringSessionResponse, error) {
	sessions, err := s.repo.ListSessionsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	return toSessionResponses(sessions), nil
}

func toSessionResponses(sessions []models.TutoringSession) []TutoringSessionResponse {
	res := make([]TutoringSessionResponse, len(sessions))
	for i, v := range sessions {
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
		res[i] = TutoringSessionResponse{
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
	return res
}

func (s *Service) ListMySessions(studentID uint) ([]TutoringSessionResponse, error) {
	sessions, err := s.repo.ListSessionsByUser(studentID)
	if err != nil {
		return nil, err
	}
	return toSessionResponses(sessions), nil
}

const evidenceWindowDays = 7

type RescheduleSessionInput struct {
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type ReviewEvidenceInput struct {
	Action string `json:"action"` // approve/reject
}

// getOwnedSession mengambil sesi milik guru dan memastikan guru pemilik booking-nya.
func (s *Service) getOwnedSession(sessionID, teacherID uint) (*models.TutoringSession, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	if session.Booking == nil || session.Booking.TeacherID == nil || *session.Booking.TeacherID != teacherID {
		return nil, errors.New("bukan guru pemilik sesi ini")
	}
	return session, nil
}

// RescheduleSession memindahkan sesi ke waktu lain oleh guru (tanpa approval murid).
func (s *Service) RescheduleSession(sessionID, teacherID uint, input RescheduleSessionInput) (*TutoringSessionResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" {
		return nil, errors.New("hanya sesi terjadwal yang bisa di-reschedule")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	if err := s.validateAvailability(teacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}
	conflict, err := s.repo.SessionConflict(teacherID, input.Date, input.StartTime, input.EndTime, sessionID)
	if err != nil {
		return nil, err
	}
	if conflict {
		return nil, errors.New("guru sudah memiliki sesi pada jam tersebut")
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"date":       input.Date,
		"start_time": input.StartTime,
		"end_time":   input.EndTime,
	}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], nil
}

// CancelSession membatalkan sesi oleh guru (scheduled → cancelled).
func (s *Service) CancelSession(sessionID, teacherID uint) (*TutoringSessionResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" {
		return nil, errors.New("hanya sesi terjadwal yang bisa dibatalkan")
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{"status": "cancelled"}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], nil
}

// UploadEvidence menyimpan foto bukti kehadiran guru dan menandai sesi "review"
// (menunggu validasi admin). Jendela upload: mulai jam sesi mulai sampai H+7 setelah sesi berakhir.
func (s *Service) UploadEvidence(sessionID, teacherID uint, objectName string) (*TutoringSessionResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" {
		return nil, errors.New("hanya sesi terjadwal yang bisa diisi bukti kehadiran")
	}
	start, err := time.ParseInLocation("2006-01-02 15:04", session.Date+" "+session.StartTime, time.Local)
	if err != nil {
		return nil, errors.New("waktu sesi tidak valid")
	}
	end, err := time.ParseInLocation("2006-01-02 15:04", session.Date+" "+session.EndTime, time.Local)
	if err != nil {
		return nil, errors.New("waktu sesi tidak valid")
	}
	now := time.Now()
	if now.Before(start) {
		return nil, errors.New("sesi belum dimulai — upload bukti setelah jam mulai")
	}
	deadline := end.Add(evidenceWindowDays * 24 * time.Hour)
	if now.After(deadline) {
		return nil, errors.New("batas upload bukti sudah lewat (maksimal 7 hari setelah sesi berakhir)")
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"evidence_url": objectName,
		"status":       "review",
	}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], nil
}

// ListEvidence mengembalikan sesi yang punya bukti, difilter status ("" = semua).
// Plus info fee & status invoice utk halaman admin gabungan validasi + fee guru.
func (s *Service) ListEvidence(status string) ([]TutoringSessionResponse, error) {
	sessions, err := s.repo.ListSessionsWithEvidence(status)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses(sessions)
	for i, v := range sessions {
		paid := v.Booking != nil && v.Booking.Invoice != nil && v.Booking.Invoice.Status == "paid"
		res[i].InvoicePaid = paid
		// fee_amount cuma relevan utk sesi selesai yg muridnya sudah lunas
		if v.Status == "done" && paid {
			perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
			res[i].FeeAmount = s.sessionFee(perSession)
		}
	}
	return res, nil
}

// ApproveEvidence menyetujui bukti → sesi selesai.
func (s *Service) ApproveEvidence(sessionID uint) (*TutoringSessionResponse, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	if session.EvidenceURL == "" || session.Status != "review" {
		return nil, errors.New("tidak ada bukti yang menunggu validasi pada sesi ini")
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{"status": "done"}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], nil
}

// RejectEvidence menolak bukti → sesi kembali terjadwal, bukti dihapus.
// Mengembalikan objectName bukti lama supaya handler bisa menghapus file MinIO.
func (s *Service) RejectEvidence(sessionID uint) (*TutoringSessionResponse, string, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, "", errors.New("sesi tidak ditemukan")
	}
	if session.EvidenceURL == "" || session.Status != "review" {
		return nil, "", errors.New("tidak ada bukti yang menunggu validasi pada sesi ini")
	}
	oldObject := session.EvidenceURL
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"evidence_url": "",
		"status":       "scheduled",
	}); err != nil {
		return nil, "", err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, "", err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], oldObject, nil
}

type AdminBookingReport struct {
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

// ListAdminSessionReport mengagregasi jumlah pertemuan per booking + nominal refund.
func (s *Service) ListAdminSessionReport() ([]AdminBookingReport, error) {
	bookings, err := s.repo.ListAllBookingsWithSessions()
	if err != nil {
		return nil, err
	}
	reports := make([]AdminBookingReport, 0, len(bookings))
	for _, b := range bookings {
		perSession := s.perSessionPrice(b.ClassID, b.Mode)
		rep := AdminBookingReport{
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
		reports = append(reports, rep)
	}
	return reports, nil
}

// ListTeacherFeeSessions mengembalikan sesi terlaksana (done) dari booking yang
// invoice-nya sudah lunas, utk pencatatan fee guru.
func (s *Service) ListTeacherFeeSessions() ([]TutoringSessionResponse, error) {
	sessions, err := s.repo.ListSessionsDone()
	if err != nil {
		return nil, err
	}
	result := make([]TutoringSessionResponse, 0, len(sessions))
	for _, v := range sessions {
		// hanya sesi yang muridnya sudah bayar
		if v.Booking == nil || v.Booking.Invoice == nil || v.Booking.Invoice.Status != "paid" {
			continue
		}
		res := toSessionResponses([]models.TutoringSession{v})[0]
		perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
		res.FeeAmount = s.sessionFee(perSession)
		result = append(result, res)
	}
	return result, nil
}

// ToggleSessionFeePaid membalik status pembayaran fee guru pada sesi.
func (s *Service) ToggleSessionFeePaid(sessionID uint) (*TutoringSessionResponse, error) {
	if _, err := s.repo.ToggleSessionFeePaid(sessionID); err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	res := toSessionResponses([]models.TutoringSession{*updated})
	return &res[0], nil
}

type TeacherEarningsResponse struct {
	TotalSessions  int                       `json:"total_sessions"`
	TotalFee       float64                   `json:"total_fee"`
	FeePaidTotal   float64                   `json:"fee_paid_total"`
	FeeUnpaidTotal float64                   `json:"fee_unpaid_total"`
	Sessions       []TutoringSessionResponse `json:"sessions"`
}

// ListTeacherEarnings mengembalikan riwayat sesi selesai milik guru + estimasi fee.
func (s *Service) ListTeacherEarnings(teacherID uint) (*TeacherEarningsResponse, error) {
	sessions, err := s.repo.ListSessionsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	resp := &TeacherEarningsResponse{}
	for _, v := range sessions {
		if v.Status != "done" || v.Booking == nil {
			continue
		}
		perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
		fee := s.sessionFee(perSession)
		sv := toSessionResponses([]models.TutoringSession{v})[0]
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
	return resp, nil
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func toBookingResponse(b models.Booking) BookingResponse {
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
	return BookingResponse{
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

func toBookingResponses(bookings []models.Booking) []BookingResponse {
	res := make([]BookingResponse, len(bookings))
	for i, v := range bookings {
		res[i] = toBookingResponse(v)
	}
	return res
}
