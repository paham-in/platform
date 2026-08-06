package program

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

func (r *Repository) List() ([]models.Program, error) {
	var programs []models.Program
	if err := r.db.Order("name asc").Find(&programs).Error; err != nil {
		return nil, err
	}
	return programs, nil
}

func (r *Repository) Get(id uint) (*models.Program, error) {
	var program models.Program
	if err := r.db.First(&program, id).Error; err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *Repository) GetBySlug(slug string) (*models.Program, error) {
	var program models.Program
	if err := r.db.Where("slug = ?", slug).First(&program).Error; err != nil {
		return nil, err
	}
	return &program, nil
}

func (r *Repository) ListClasses(programID uint) ([]models.Class, error) {
	var classes []models.Class
	if err := r.db.Where("program_id = ?", programID).Order("name asc").Find(&classes).Error; err != nil {
		return nil, err
	}
	return classes, nil
}

func (r *Repository) Create(program *models.Program) error {
	return r.db.Create(program).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.Program{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Program{}, id).Error
}

// AssignClass mengaitkan kelas ke program (update class.program_id).
func (r *Repository) AssignClass(programID, classID uint) error {
	return r.db.Model(&models.Class{}).Where("id = ?", classID).Update("program_id", programID).Error
}

// UnassignClass melepas kelas dari program.
func (r *Repository) UnassignClass(classID uint) error {
	return r.db.Model(&models.Class{}).Where("id = ?", classID).Update("program_id", nil).Error
}
