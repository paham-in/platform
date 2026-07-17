package class

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

func (r *Repository) List() ([]models.Class, error) {
	var classes []models.Class
	if err := r.db.Order("name asc").Find(&classes).Error; err != nil {
		return nil, err
	}
	return classes, nil
}

func (r *Repository) Get(id uint) (*models.Class, error) {
	var class models.Class
	if err := r.db.First(&class, id).Error; err != nil {
		return nil, err
	}
	return &class, nil
}

func (r *Repository) Create(class *models.Class) error {
	return r.db.Create(class).Error
}

func (r *Repository) Update(id uint, updates map[string]interface{}) error {
	return r.db.Model(&models.Class{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.Class{}, id).Error
}
