package subject

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

func (r *Repository) List() ([]models.Subject, error) {
	var subjects []models.Subject
	if err := r.db.Order("name asc").Find(&subjects).Error; err != nil {
		return nil, err
	}
	return subjects, nil
}

func (r *Repository) Get(id uint) (*models.Subject, error) {
	var subject models.Subject
	if err := r.db.First(&subject, id).Error; err != nil {
		return nil, err
	}
	return &subject, nil
}

func (r *Repository) Create(subject *models.Subject) error {
	return r.db.Create(subject).Error
}

func (r *Repository) Update(id uint, updates map[string]interface{}) error {
	return r.db.Model(&models.Subject{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Subject{}, id).Error
}
