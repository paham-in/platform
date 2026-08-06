package studentprogram

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

func (r *Repository) List(filterUserID, filterProgramID uint) ([]models.StudentProgram, error) {
	var sp []models.StudentProgram
	q := r.db.Order("created_at desc")
	if filterUserID > 0 {
		q = q.Where("user_id = ?", filterUserID)
	}
	if filterProgramID > 0 {
		q = q.Where("program_id = ?", filterProgramID)
	}
	if err := q.Find(&sp).Error; err != nil {
		return nil, err
	}
	return sp, nil
}

func (r *Repository) Get(id uint) (*models.StudentProgram, error) {
	var sp models.StudentProgram
	if err := r.db.First(&sp, id).Error; err != nil {
		return nil, err
	}
	return &sp, nil
}

func (r *Repository) Create(sp *models.StudentProgram) error {
	return r.db.Create(sp).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.StudentProgram{}, id).Error
}

// Upsert mencekikup user+program → hapus yang lama, masukkan baru.
func (r *Repository) Upsert(sp *models.StudentProgram) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Where("user_id = ? AND program_id = ?", sp.UserID, sp.ProgramID).Delete(&models.StudentProgram{})
		return tx.Create(sp).Error
	})
}
