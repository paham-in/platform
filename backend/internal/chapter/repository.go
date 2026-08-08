package chapter

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

func (r *Repository) ListByClassSubject(classID, subjectID uint) ([]models.Chapter, error) {
	var chapters []models.Chapter
	if err := r.db.Preload("Class").Preload("Subject").
		Where("class_id = ? AND subject_id = ?", classID, subjectID).
		Order("\"order\" asc, title asc").Find(&chapters).Error; err != nil {
		return nil, err
	}
	return chapters, nil
}

func (r *Repository) List() ([]models.Chapter, error) {
	var chapters []models.Chapter
	if err := r.db.Preload("Class").Preload("Subject").
		Order("\"order\" asc, title asc").Find(&chapters).Error; err != nil {
		return nil, err
	}
	return chapters, nil
}

// ListScoped mengembalikan chapter. classIDs non-nil membatasi ke kelas
// tertentu (hak akses student); nil = semua kelas (staff).
func (r *Repository) ListScoped(classIDs []uint) ([]models.Chapter, error) {
	q := r.db.Preload("Class").Preload("Subject")
	if classIDs != nil {
		q = q.Where("class_id IN ?", classIDs)
	}
	var chapters []models.Chapter
	if err := q.Order("\"order\" asc, title asc").Find(&chapters).Error; err != nil {
		return nil, err
	}
	return chapters, nil
}

// ListByClassSubjectScoped sama dengan ListScoped tapi difilter class+subject.
func (r *Repository) ListByClassSubjectScoped(classID, subjectID uint, classIDs []uint) ([]models.Chapter, error) {
	q := r.db.Preload("Class").Preload("Subject").
		Where("class_id = ? AND subject_id = ?", classID, subjectID)
	if classIDs != nil {
		q = q.Where("class_id IN ?", classIDs)
	}
	var chapters []models.Chapter
	if err := q.Order("\"order\" asc, title asc").Find(&chapters).Error; err != nil {
		return nil, err
	}
	return chapters, nil
}

func (r *Repository) Get(id uint) (*models.Chapter, error) {
	var chapter models.Chapter
	if err := r.db.Preload("Class").Preload("Subject").First(&chapter, id).Error; err != nil {
		return nil, err
	}
	return &chapter, nil
}

func (r *Repository) Create(chapter *models.Chapter) error {
	return r.db.Create(chapter).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.Chapter{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.Chapter{}, id).Error
}

func (r *Repository) MaterialCount(chapterID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Material{}).Where("chapter_id = ?", chapterID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
