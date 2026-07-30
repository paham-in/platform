package tutoring

import (
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
