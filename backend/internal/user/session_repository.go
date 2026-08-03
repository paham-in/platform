package user

import (
	"time"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(s *models.Session) error {
	return r.db.Create(s).Error
}

func (r *SessionRepository) GetByToken(token string) (*models.Session, error) {
	var s models.Session
	if err := r.db.Where("token = ? AND expires_at > ?", token, time.Now().Unix()).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) Delete(token string) error {
	return r.db.Where("token = ?", token).Delete(&models.Session{}).Error
}

func (r *SessionRepository) DeleteAllByUser(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.Session{}).Error
}
