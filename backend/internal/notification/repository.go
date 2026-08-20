package notification

import (
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

func (r *Repository) Create(n *models.Notification) error {
	return r.db.Create(n).Error
}

func (r *Repository) CreateBatch(notifications []models.Notification) error {
	if len(notifications) == 0 {
		return nil
	}
	return r.db.Create(&notifications).Error
}

func (r *Repository) ListByUser(userID uint, limit, offset int) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	q := r.db.Where("user_id = ?", userID)
	if err := q.Model(&models.Notification{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := q.Order("created_at desc").Limit(limit).Offset(offset).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}
	return notifications, total, nil
}

func (r *Repository) UnreadCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (r *Repository) GetByPublicID(publicID string) (*models.Notification, error) {
	var n models.Notification
	if err := r.db.Where("public_id = ?", publicID).First(&n).Error; err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *Repository) MarkRead(userID, id uint) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ? AND id = ?", userID, id).
		Update("is_read", true).Error
}

func (r *Repository) MarkAllRead(userID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (r *Repository) ListTeacherIDsBySubject(subjectID uint) ([]uint, error) {
	var userIDs []uint
	err := r.db.Table("teacher_subjects").
		Where("subject_id = ?", subjectID).
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

func (r *Repository) ListTeacherIDs() ([]uint, error) {
	var userIDs []uint
	err := r.db.Table("user_roles").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.name = ?", "teacher").
		Pluck("user_roles.user_id", &userIDs).Error
	return userIDs, err
}

// DeleteReadOlderThan hard-deletes notifications that are read and older than cutoff.
func (r *Repository) DeleteReadOlderThan(cutoff time.Time) (int64, error) {
	result := r.db.Unscoped().
		Where("is_read = ? AND created_at < ?", true, cutoff).
		Delete(&models.Notification{})
	return result.RowsAffected, result.Error
}
