package material

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

func (r *Repository) List() ([]models.Material, error) {
	var materials []models.Material
	if err := r.db.Preload("Subject").Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) ListBySubject(subjectID uint) ([]models.Material, error) {
	var materials []models.Material
	if err := r.db.Preload("Subject").Where("subject_id = ?", subjectID).Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) Get(id uint) (*models.Material, error) {
	var material models.Material
	if err := r.db.Preload("Subject").First(&material, id).Error; err != nil {
		return nil, err
	}
	return &material, nil
}

func (r *Repository) Create(material *models.Material) error {
	return r.db.Create(material).Error
}

func (r *Repository) Update(id uint, updates map[string]interface{}) error {
	return r.db.Model(&models.Material{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Material{}, id).Error
}

func (r *Repository) CountBySubject(subjectID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Material{}).Where("subject_id = ?", subjectID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
