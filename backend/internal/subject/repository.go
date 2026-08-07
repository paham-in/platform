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

func (r *Repository) GetClassIDs(subjectID uint) ([]uint, error) {
	var classIDs []uint
	if err := r.db.Model(&models.ClassSubject{}).Where("subject_id = ?", subjectID).Pluck("class_id", &classIDs).Error; err != nil {
		return nil, err
	}
	return classIDs, nil
}

// HasClassOutsideProgram true jika ada kelas yang sudah terikat program lain.
// Kelas dengan program_id NULL dianggap kompatibel program mana pun.
func (r *Repository) HasClassOutsideProgram(programID uint, classIDs []uint) (bool, error) {
	if len(classIDs) == 0 {
		return false, nil
	}
	var n int64
	if err := r.db.Model(&models.Class{}).
		Where("id IN ? AND program_id IS NOT NULL AND program_id != ?", classIDs, programID).
		Count(&n).Error; err != nil {
		return false, err
	}
	return n > 0, nil
}

func (r *Repository) Create(subject *models.Subject) error {
	return r.db.Create(subject).Error
}

func (r *Repository) SetClasses(subjectID uint, classIDs []uint) error {
	if err := r.db.Unscoped().Where("subject_id = ?", subjectID).Delete(&models.ClassSubject{}).Error; err != nil {
		return err
	}
	if len(classIDs) == 0 {
		return nil
	}
	pivots := make([]models.ClassSubject, len(classIDs))
	for i, cid := range classIDs {
		pivots[i] = models.ClassSubject{ClassID: cid, SubjectID: subjectID}
	}
	return r.db.Create(&pivots).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.Subject{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	r.db.Unscoped().Where("subject_id = ?", id).Delete(&models.ClassSubject{})
	return r.db.Unscoped().Delete(&models.Subject{}, id).Error
}

func (r *Repository) MaterialCount(subjectID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Material{}).
		Joins("JOIN chapters ON chapters.id = materials.chapter_id").
		Where("chapters.subject_id = ?", subjectID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
