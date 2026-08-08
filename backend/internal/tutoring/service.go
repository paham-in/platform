package tutoring

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

const maxGroupSlots = 5

// defaultPrice = fallback biaya per pertemuan les privat ketika kelas
// murid tidak punya harga / class_id kosong (data lama).
const defaultPrice = 30000.0

type AvailabilityResponse struct {
	ID        uint   `json:"id"`
	TeacherID uint   `json:"teacher_id"`
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type BookingResponse struct {
	ID           uint   `json:"id"`
	TeacherID    uint   `json:"teacher_id"`
	Teacher      string `json:"teacher_name"`
	StudentID    uint   `json:"student_id"`
	Student      string `json:"student_name"`
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Status       string `json:"status"`
	Mode         string `json:"mode"`
	SessionCount int    `json:"session_count"`
	GroupToken   string `json:"group_token"`
	Note         string `json:"note"`
	ClassID      *uint  `json:"class_id,omitempty"`
	CreatedAt    string `json:"created_at"`
}

type TutoringSessionResponse struct {
	ID        uint   `json:"id"`
	BookingID uint   `json:"booking_id"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Status    string `json:"status"`
	Teacher   string `json:"teacher_name"`
	Student   string `json:"student_name"`
	Mode      string `json:"mode"`
	Note      string `json:"note"`
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
	ID        uint          `json:"id"`
	Name      string        `json:"name"`
	Email     string        `json:"email"`
	AvatarURL string        `json:"avatar_url"`
	Subjects  []SubjectInfo `json:"subjects"`
}

type SubjectInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
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

func (s *Service) ListTeachers() ([]TeacherResponse, error) {
	users, err := s.repo.ListTeachers()
	if err != nil {
		return nil, err
	}
	res := make([]TeacherResponse, len(users))
	for i, u := range users {
		subjects := make([]SubjectInfo, len(u.Subjects))
		for j, s := range u.Subjects {
			subjects[j] = SubjectInfo{ID: s.ID, Name: s.Name}
		}
		res[i] = TeacherResponse{ID: u.ID, Name: u.Name, Email: u.Email, AvatarURL: u.AvatarURL, Subjects: subjects}
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
	TeacherID    uint   `json:"teacher_id"`
	Date         string `json:"date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Mode         string `json:"mode"`          // private/semi_private
	SessionCount int    `json:"session_count"` // jumlah pertemuan (default 1)
	GroupToken   string `json:"group_token"`   // isi utk join grup yang sudah ada
	Note         string `json:"note"`
	ClassID      *uint  `json:"class_id,omitempty"`
}

type AdminCreateBookingInput struct {
	StudentID    uint   `json:"student_id"`
	TeacherID    uint   `json:"teacher_id"`
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
	// validasi slot sesuai jadwal kosong guru
	if err := s.validateAvailability(input.TeacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}
	// cek konflik jadwal guru
	if err := s.checkTeacherConflict(input.TeacherID, input.Date, input.StartTime, input.EndTime, ""); err != nil {
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

	booking := models.Booking{
		TeacherID:    input.TeacherID,
		StudentID:    studentID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "pending",
		Mode:         input.Mode,
		SessionCount: input.SessionCount,
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

// AdminCreateBooking daftarkan les privat manual atas nama murid.
// Langsung status confirmed + generate sesi & invoice (admin tinggal tandai lunas).
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

	booking := models.Booking{
		TeacherID:    input.TeacherID,
		StudentID:    input.StudentID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "confirmed",
		Mode:         input.Mode,
		SessionCount: input.SessionCount,
		Note:         input.Note,
		ClassID:      input.ClassID,
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	if err := s.createSessionsAndInvoice(booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*created)
	return &r, nil
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
	if organizer.TeacherID != input.TeacherID ||
		organizer.Date != input.Date ||
		organizer.StartTime != input.StartTime ||
		organizer.EndTime != input.EndTime {
		return nil, errors.New("data booking harus sama dengan grup (guru, tanggal, jam)")
	}

	booking := models.Booking{
		TeacherID:    organizer.TeacherID,
		StudentID:    studentID,
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
	if booking.TeacherID != teacherID {
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
				if err := s.createSessionsAndInvoice(b); err != nil {
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

// getClassPrices mengembalikan harga les privat per kelas.
// Kelas tidak ditemukan / belum diisi harga → 0 (fallback defaultPrice).
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

// createSessionsAndInvoice membuat sesi pertemuan mingguan + invoice pembayaran.
func (s *Service) createSessionsAndInvoice(booking models.Booking) error {
	date, err := time.Parse("2006-01-02", booking.Date)
	if err != nil {
		return errors.New("tanggal booking tidak valid")
	}

	sessions := make([]models.TutoringSession, booking.SessionCount)
	startDate := date
	endDate := date
	for i := 0; i < booking.SessionCount; i++ {
		d := date.AddDate(0, 0, 7*i)
		if i == 0 {
			startDate = d
		}
		endDate = d
		sessions[i] = models.TutoringSession{
			BookingID: booking.ID,
			Date:      d.Format("2006-01-02"),
			StartTime: booking.StartTime,
			EndTime:   booking.EndTime,
			Status:    "scheduled",
		}
	}
	if err := s.repo.CreateSessions(sessions); err != nil {
		return err
	}

	modeLabel := "private"
	if booking.Mode == "semi_private" {
		modeLabel = "semi-private"
	}
	price, semiPrice := s.getClassPrices(booking.ClassID)
	perSession := price
	if booking.Mode == "semi_private" {
		perSession = semiPrice
	}
	if perSession <= 0 {
		perSession = defaultPrice
	}
	invoice := models.Invoice{
		UserID:    booking.StudentID,
		Amount:    perSession * float64(booking.SessionCount),
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
		Status:    "pending",
		Note:      fmt.Sprintf("Les %s — %d pertemuan", modeLabel, booking.SessionCount),
		BookingID: &booking.ID,
	}
	return s.repo.CreateInvoice(&invoice)
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
	if organizer.Teacher != nil {
		teacherName = organizer.Teacher.Name
	}
	return &GroupInfoResponse{
		TeacherID:    organizer.TeacherID,
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
			ID:        v.ID,
			BookingID: v.BookingID,
			Date:      v.Date,
			StartTime: v.StartTime,
			EndTime:   v.EndTime,
			Status:    v.Status,
			Teacher:   teacherName,
			Student:   studentName,
			Mode:      mode,
			Note:      note,
		}
	}
	return res
}

func (s *Service) ListMySessions(studentID uint) ([]TutoringSessionResponse, error) {
	sessions, err := s.repo.ListSessionsByUserPaid(studentID)
	if err != nil {
		return nil, err
	}
	return toSessionResponses(sessions), nil
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
	if b.Student != nil {
		studentName = b.Student.Name
	}
	if b.Teacher != nil {
		teacherName = b.Teacher.Name
	}
	return BookingResponse{
		ID:           b.ID,
		TeacherID:    b.TeacherID,
		Teacher:      teacherName,
		StudentID:    b.StudentID,
		Student:      studentName,
		Date:         b.Date,
		StartTime:    b.StartTime,
		EndTime:      b.EndTime,
		Status:       b.Status,
		Mode:         b.Mode,
		SessionCount: b.SessionCount,
		GroupToken:   b.GroupToken,
		Note:         b.Note,
		ClassID:      b.ClassID,
		CreatedAt:    b.CreatedAt.Format("2006-01-02"),
	}
}

func toBookingResponses(bookings []models.Booking) []BookingResponse {
	res := make([]BookingResponse, len(bookings))
	for i, v := range bookings {
		res[i] = toBookingResponse(v)
	}
	return res
}
