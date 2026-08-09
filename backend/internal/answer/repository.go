package answer

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

func (r *Repository) ListByQuestion(questionID uint) ([]models.Answer, error) {
	var answers []models.Answer
	if err := r.db.Preload("User").Where("question_id = ?", questionID).Order("created_at asc").Find(&answers).Error; err != nil {
		return nil, err
	}
	return answers, nil
}

// CreateWithDB menyimpan jawaban memakai koneksi tertentu (bisa tx).
func (r *Repository) CreateWithDB(db *gorm.DB, a *models.Answer) error {
	return db.Create(a).Error
}

func (r *Repository) ReloadWithUser(a *models.Answer) error {
	return r.db.Preload("User").First(a, a.ID).Error
}

func (r *Repository) GetByID(id uint) (*models.Answer, error) {
	var a models.Answer
	if err := r.db.First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Answer{}, id).Error
}
