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
	if err := r.db.Preload("Chapter").Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) ListByChapter(chapterID uint) ([]models.Material, error) {
	var materials []models.Material
	if err := r.db.Preload("Chapter").Where("chapter_id = ?", chapterID).Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

// ListScoped utk non-admin: published + materi milik caller + materi tanpa pemilik.
func (r *Repository) ListScoped(callerID uint) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter").Where("status = ? OR author_id = ? OR author_id = 0", "published", callerID)
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) ListByChapterScoped(chapterID, callerID uint) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter").Where("chapter_id = ? AND (status = ? OR author_id = ? OR author_id = 0)", chapterID, "published", callerID)
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) Get(id uint) (*models.Material, error) {
	var material models.Material
	if err := r.db.Preload("Chapter").First(&material, id).Error; err != nil {
		return nil, err
	}
	return &material, nil
}

// ListPublished mengembalikan materi berstatus published. includePremium=false
// hanya menyertakan materi free (is_free=true). includePremium=true dengan classIDs
// (non-nil) membatasi premium ke kelas tertentu; classIDs nil = semua kelas (staff).
func (r *Repository) ListPublished(includePremium bool, classIDs []uint) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter").Where("status = ?", "published")
	if !includePremium {
		q = q.Where("is_free = ?", true)
	} else if classIDs != nil {
		q = q.Where("is_free = ? OR chapter_id IN (SELECT id FROM chapters WHERE class_id IN ?)", true, classIDs)
	}
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) ListPublishedByChapter(chapterID uint, includePremium bool, classIDs []uint) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter").Where("chapter_id = ? AND status = ?", chapterID, "published")
	if !includePremium {
		q = q.Where("is_free = ?", true)
	} else if classIDs != nil {
		q = q.Where("is_free = ? OR chapter_id IN (SELECT id FROM chapters WHERE class_id IN ?)", true, classIDs)
	}
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) Create(material *models.Material) error {
	return r.db.Create(material).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.Material{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.Material{}, id).Error
}

func (r *Repository) CountByChapter(chapterID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Material{}).Where("chapter_id = ?", chapterID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
