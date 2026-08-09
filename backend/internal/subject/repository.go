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

// CreateWithClasses membuat subject + relasi class_subjects dalam satu
// transaksi — kalau SetClasses gagal, subject ikut batal (bukan subject yatim).
func (r *Repository) CreateWithClasses(subject *models.Subject, classIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(subject).Error; err != nil {
			return err
		}
		return r.setClassesTx(tx, subject.ID, classIDs)
	})
}

// UpdateWithClasses mengubah subject + relasi class_subjects dalam satu
// transaksi. replaceClasses=true → class_subjects diganti dengan classIDs.
func (r *Repository) UpdateWithClasses(id uint, updates map[string]any, classIDs []uint, replaceClasses bool) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(&models.Subject{}).Where("id = ?", id).Updates(updates).Error; err != nil {
				return err
			}
		}
		if replaceClasses {
			return r.setClassesTx(tx, id, classIDs)
		}
		return nil
	})
}

// setClassesTx mengganti relasi subject↔kelas (hapus lama + insert baru) memakai
// koneksi tertentu (bisa tx).
func (r *Repository) setClassesTx(db *gorm.DB, subjectID uint, classIDs []uint) error {
	if err := db.Unscoped().Where("subject_id = ?", subjectID).Delete(&models.ClassSubject{}).Error; err != nil {
		return err
	}
	if len(classIDs) == 0 {
		return nil
	}
	pivots := make([]models.ClassSubject, len(classIDs))
	for i, cid := range classIDs {
		pivots[i] = models.ClassSubject{ClassID: cid, SubjectID: subjectID}
	}
	return db.Create(&pivots).Error
}

// Delete menghapus relasi class_subjects + subject dalam satu transaksi.
func (r *Repository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("subject_id = ?", id).Delete(&models.ClassSubject{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.Subject{}, id).Error
	})
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
