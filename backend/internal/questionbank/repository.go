package questionbank

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

func (r *Repository) ListByChapter(chapterID uint) ([]models.QuestionBank, error) {
	var questions []models.QuestionBank
	if err := r.db.Where("chapter_id = ?", chapterID).Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) List() ([]models.QuestionBank, error) {
	var questions []models.QuestionBank
	if err := r.db.Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Get(id uint) (*models.QuestionBank, error) {
	var q models.QuestionBank
	if err := r.db.First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) Create(q *models.QuestionBank) error {
	return r.db.Create(q).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.QuestionBank{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.QuestionBank{}, id).Error
}
