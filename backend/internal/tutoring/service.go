package tutoring

import (
	"errors"
	"time"

	"bimbel2/backend/internal/models"
)

type AvailabilityResponse struct {
	ID        uint   `json:"id"`
	TeacherID uint   `json:"teacher_id"`
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type BookingResponse struct {
	ID        uint   `json:"id"`
	TeacherID uint   `json:"teacher_id"`
	Teacher   string `json:"teacher_name"`
	StudentID uint   `json:"student_id"`
	Student   string `json:"student_name"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Status    string `json:"status"`
	Note      string `json:"note"`
	CreatedAt string `json:"created_at"`
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
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
	TeacherID uint   `json:"teacher_id"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Note      string `json:"note"`
}

func (s *Service) CreateBooking(studentID uint, input CreateBookingInput) (*BookingResponse, error) {
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}

	booking := models.Booking{
		TeacherID: input.TeacherID,
		StudentID: studentID,
		Date:      input.Date,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
		Status:    "pending",
		Note:      input.Note,
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

	if err := s.repo.UpdateBookingStatus(id, status); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := toBookingResponse(*updated)
	return &r, nil
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
		ID:        b.ID,
		TeacherID: b.TeacherID,
		Teacher:   teacherName,
		StudentID: b.StudentID,
		Student:   studentName,
		Date:      b.Date,
		StartTime: b.StartTime,
		EndTime:   b.EndTime,
		Status:    b.Status,
		Note:      b.Note,
		CreatedAt: b.CreatedAt.Format("2006-01-02"),
	}
}

func toBookingResponses(bookings []models.Booking) []BookingResponse {
	res := make([]BookingResponse, len(bookings))
	for i, v := range bookings {
		res[i] = toBookingResponse(v)
	}
	return res
}
