package studentclass

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

func (r *Repository) List(filterUserID, filterClassID, filterProgramID uint, search string) ([]models.StudentClass, error) {
	var sp []models.StudentClass
	q := r.db.Order("created_at desc")
	if filterUserID > 0 {
		q = q.Where("user_id = ?", filterUserID)
	}
	if filterClassID > 0 {
		q = q.Where("class_id = ?", filterClassID)
	}
	if filterProgramID > 0 {
		q = q.Joins("JOIN classes ON classes.id = student_classes.class_id").
			Where("classes.program_id = ?", filterProgramID)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.
			Joins("JOIN users ON users.id = student_classes.user_id").
			Joins("JOIN classes ON classes.id = student_classes.class_id").
			Joins("LEFT JOIN programs ON programs.id = classes.program_id").
			Where("users.name ILIKE ? OR users.email ILIKE ? OR classes.name ILIKE ? OR programs.name ILIKE ?", like, like, like, like)
	}
	if err := q.Find(&sp).Error; err != nil {
		return nil, err
	}
	return sp, nil
}

func (r *Repository) Get(id uint) (*models.StudentClass, error) {
	var sp models.StudentClass
	if err := r.db.First(&sp, id).Error; err != nil {
		return nil, err
	}
	return &sp, nil
}

func (r *Repository) Create(sp *models.StudentClass) error {
	return r.db.Create(sp).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.StudentClass{}, id).Error
}

// Upsert hapus akses lama kombinasi user+class → masukkan baru.
func (r *Repository) Upsert(sp *models.StudentClass) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Where("user_id = ? AND class_id = ?", sp.UserID, sp.ClassID).Delete(&models.StudentClass{})
		return tx.Create(sp).Error
	})
}
