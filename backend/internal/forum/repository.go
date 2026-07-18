package forum

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

func (r *Repository) List(subjectID, userID *uint) ([]models.Question, error) {
	var questions []models.Question
	q := r.db.Preload("User").Preload("Subject")
	if subjectID != nil {
		q = q.Where("subject_id = ?", *subjectID)
	}
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	}
	if err := q.Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) GetByID(id uint) (*models.Question, error) {
	var q models.Question
	if err := r.db.Preload("User").Preload("Subject").First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) Create(q *models.Question) error {
	return r.db.Create(q).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Question{}, id).Error
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
