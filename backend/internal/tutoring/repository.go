package tutoring

import (
	"errors"
	"time"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListAvailability(teacherID uint) ([]models.Availability, error) {
	var slots []models.Availability
	if err := r.db.Where("teacher_id = ?", teacherID).Order("day_of_week, start_time").Find(&slots).Error; err != nil {
		return nil, err
	}
	return slots, nil
}

func (r *Repository) ListTeachers() ([]models.User, error) {
	var users []models.User
	if err := r.db.
		Joins("JOIN user_roles ON user_roles.user_id = users.id").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.name = ?", "teacher").
		Preload("Roles").
		Preload("Subjects").
		Order("users.name").
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *Repository) CreateAvailability(slot *models.Availability) error {
	return r.db.Create(slot).Error
}

func (r *Repository) DeleteAvailability(id, teacherID uint) error {
	return r.db.Where("id = ? AND teacher_id = ?", id, teacherID).Delete(&models.Availability{}).Error
}

func (r *Repository) ListBookingsByTeacher(teacherID uint) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.Preload("Student").Where("teacher_id = ?", teacherID).Order("date desc, start_time").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *Repository) ListAllBookings() ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.Preload("Student").Preload("Teacher").Order("date desc, start_time").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *Repository) ListBookingsByStudent(studentID uint) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.Preload("Teacher").Where("student_id = ?", studentID).Order("date desc, start_time").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *Repository) CreateBooking(booking *models.Booking) error {
	return r.db.Create(booking).Error
}

// ListBookingsByTeacherAndDate mengembalikan booking guru pada tanggal tertentu
// dengan status tertentu (untuk cek konflik jadwal).
func (r *Repository) ListBookingsByTeacherAndDate(teacherID uint, date string, statuses []string) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.
		Where("teacher_id = ? AND date = ? AND status IN ?", teacherID, date, statuses).
		Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *Repository) UpdateBookingStatus(id uint, status string) error {
	return r.db.Model(&models.Booking{}).Where("id = ?", id).Update("status", status).Error
}

func (r *Repository) GetBooking(id uint) (*models.Booking, error) {
	var b models.Booking
	if err := r.db.Preload("Student").Preload("Teacher").First(&b, id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

// GetBookingByToken mengambil booking organizer (yang pertama) dari token grup.
func (r *Repository) GetBookingByToken(token string) (*models.Booking, error) {
	var b models.Booking
	if err := r.db.Preload("Teacher").Where("group_token = ?", token).Order("id asc").First(&b).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

// ListBookingsByGroupToken mengambil semua booking dgn token yang sama.
func (r *Repository) ListBookingsByGroupToken(token string) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.Preload("Student").Where("group_token = ?", token).Order("id asc").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

// CountGroupParticipants menghitung peserta aktif (pending/confirmed) dalam grup.
func (r *Repository) CountGroupParticipants(token string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Booking{}).
		Where("group_token = ? AND status IN ?", token, []string{"pending", "confirmed"}).
		Count(&count).Error
	return count, err
}

// CreateSessions menyimpan sesi pertemuan (bulk).
func (r *Repository) CreateSessions(sessions []models.TutoringSession) error {
	if len(sessions) == 0 {
		return nil
	}
	return r.db.Create(&sessions).Error
}

// ListSessionsByTeacher mengembalikan semua sesi dari booking milik guru.
func (r *Repository) ListSessionsByTeacher(teacherID uint) ([]models.TutoringSession, error) {
	var sessions []models.TutoringSession
	if err := r.db.
		Joins("JOIN bookings ON bookings.id = tutoring_sessions.booking_id").
		Where("bookings.teacher_id = ?", teacherID).
		Preload("Booking.Student").
		Preload("Booking.Teacher").
		Order("tutoring_sessions.date, tutoring_sessions.start_time").
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// ListSessionsByUserPaid mengembalikan sesi milik user di mana invoice terkait sudah lunas.
func (r *Repository) ListSessionsByUserPaid(studentID uint) ([]models.TutoringSession, error) {
	var sessions []models.TutoringSession
	if err := r.db.
		Joins("JOIN bookings ON bookings.id = tutoring_sessions.booking_id").
		Joins("JOIN invoices ON invoices.booking_id = bookings.id").
		Where("bookings.student_id = ? AND invoices.status = ?", studentID, "paid").
		Preload("Booking.Teacher").
		Order("tutoring_sessions.date, tutoring_sessions.start_time").
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// CreateInvoice menyimpan invoice pembayaran utk sebuah booking.
func (r *Repository) CreateInvoice(invoice *models.Invoice) error {
	return r.db.Create(invoice).Error
}

// ListSessionsDone mengembalikan semua sesi yang sudah terlaksana (done),
// dengan booking guru/murid/invoice untuk perhitungan fee.
func (r *Repository) ListSessionsDone() ([]models.TutoringSession, error) {
	var sessions []models.TutoringSession
	if err := r.db.
		Where("status = ?", "done").
		Preload("Booking.Student").
		Preload("Booking.Teacher").
		Preload("Booking.Invoice").
		Order("date desc, start_time").
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// ListAllBookingsWithSessions mengembalikan semua booking + sesi + guru/murid,
// untuk rekap jumlah pertemuan per booking.
func (r *Repository) ListAllBookingsWithSessions() ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.
		Preload("Teacher").
		Preload("Student").
		Preload("Sessions").
		Order("created_at desc").
		Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

// ListApprovedEvidenceOlderThan mengembalikan sesi done dengan bukti yg
// terakhir diupdate sebelum cutoff (utk dihapus dari MinIO).
func (r *Repository) ListApprovedEvidenceOlderThan(cutoff time.Time) ([]models.TutoringSession, error) {
	var sessions []models.TutoringSession
	if err := r.db.
		Where("status = ? AND evidence_url <> '' AND updated_at < ?", "done", cutoff).
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// ClearSessionEvidence mengosongkan kolom evidence_url sesi.
func (r *Repository) ClearSessionEvidence(id uint) error {
	return r.db.Model(&models.TutoringSession{}).Where("id = ?", id).Update("evidence_url", "").Error
}

// ToggleSessionFeePaid membalik status fee_paid sebuah sesi.
func (r *Repository) ToggleSessionFeePaid(id uint) (bool, error) {
	var s models.TutoringSession
	if err := r.db.First(&s, id).Error; err != nil {
		return false, err
	}
	if err := r.db.Model(&s).Update("fee_paid", !s.FeePaid).Error; err != nil {
		return false, err
	}
	return !s.FeePaid, nil
}

// ListSessionsWithEvidence mengembalikan sesi yang punya bukti kehadiran.
// status opsional: "" = semua, atau "review"/"done".
func (r *Repository) ListSessionsWithEvidence(status string) ([]models.TutoringSession, error) {
	var sessions []models.TutoringSession
	q := r.db.Where("evidence_url <> ''").Preload("Booking.Student").Preload("Booking.Teacher")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("date desc, start_time").Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// GetSession mengambil satu sesi pertemuan beserta booking guru/murid.
func (r *Repository) GetSession(id uint) (*models.TutoringSession, error) {
	var s models.TutoringSession
	if err := r.db.Preload("Booking.Teacher").Preload("Booking.Student").First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

// SessionConflict memeriksa bentrok jam guru pada tanggal tertentu,
// mengabaikan sesi yang sama (excludeSessionID) dan sesi yang dibatalkan.
func (r *Repository) SessionConflict(teacherID uint, date, startTime, endTime string, excludeSessionID uint) (bool, error) {
	var sessions []models.TutoringSession
	if err := r.db.
		Joins("JOIN bookings ON bookings.id = tutoring_sessions.booking_id").
		Where("bookings.teacher_id = ? AND tutoring_sessions.date = ? AND tutoring_sessions.status <> ? AND tutoring_sessions.id <> ?",
			teacherID, date, "cancelled", excludeSessionID).
		Find(&sessions).Error; err != nil {
		return false, err
	}
	newStart, err1 := timeToMinutes(startTime)
	newEnd, err2 := timeToMinutes(endTime)
	if err1 != nil || err2 != nil {
		return true, errors.New("format waktu tidak valid")
	}
	for _, s := range sessions {
		sStart, e1 := timeToMinutes(s.StartTime)
		sEnd, e2 := timeToMinutes(s.EndTime)
		if e1 != nil || e2 != nil {
			continue
		}
		if hasOverlap(newStart, newEnd, sStart, sEnd) {
			return true, nil
		}
	}
	return false, nil
}

// UpdateSession memperbarui field sesi tertentu.
func (r *Repository) UpdateSession(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.TutoringSession{}).Where("id = ?", id).Updates(fields).Error
}
