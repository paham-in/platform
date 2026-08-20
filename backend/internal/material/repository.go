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

// ListFiltered mengembalikan materi dengan filter opsional chapter_id, search
// (judul), access (free/paid), type (text/video), dan status (draft/published).
func (r *Repository) ListFiltered(chapterID *uint, search, access, type_, status string) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter")
	q = r.applyFilters(q, chapterID, search, access, type_, status)
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

// ListFilteredScoped sama dengan ListFiltered tapi dibatasi: published + materi
// milik caller + materi tanpa pemilik (non-admin).
func (r *Repository) ListFilteredScoped(chapterID *uint, search, access, type_, status string, callerID uint) ([]models.Material, error) {
	var materials []models.Material
	q := r.db.Preload("Chapter").Where("status = ? OR author_id = ? OR author_id = 0", "published", callerID)
	q = r.applyFilters(q, chapterID, search, access, type_, status)
	if err := q.Order("\"order\" asc, title asc").Find(&materials).Error; err != nil {
		return nil, err
	}
	return materials, nil
}

func (r *Repository) applyFilters(q *gorm.DB, chapterID *uint, search, access, type_, status string) *gorm.DB {
	if chapterID != nil {
		q = q.Where("chapter_id = ?", *chapterID)
	}
	if search != "" {
		q = q.Where("title ILIKE ?", "%"+search+"%")
	}
	if access == "free" {
		q = q.Where("is_free = ?", true)
	} else if access == "paid" {
		q = q.Where("is_free = ?", false)
	}
	if type_ != "" {
		q = q.Where("type = ?", type_)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	return q
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

// CreateWithAssets menyimpan materi + aset content (material_assets) dalam
// satu transaksi.
func (r *Repository) CreateWithAssets(material *models.Material, assets []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(material).Error; err != nil {
			return err
		}
		return insertAssets(tx, material.ID, assets)
	})
}

// UpdateContentWithAssets memperbarui content materi + mengganti daftar aset
// content (hapus semua, insert ulang) dalam satu transaksi. Aset dihapus secara
// HARD (Unscoped), row aset adalah data turunan, bukan data user yang butuh
// audit, jadi tidak perlu soft delete.
func (r *Repository) UpdateContentWithAssets(id uint, content string, assets []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Material{}).Where("id = ?", id).Update("content", content).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("material_id = ?", id).Delete(&models.MaterialAsset{}).Error; err != nil {
			return err
		}
		return insertAssets(tx, id, assets)
	})
}

func insertAssets(tx *gorm.DB, materialID uint, assets []string) error {
	if len(assets) == 0 {
		return nil
	}
	rows := make([]models.MaterialAsset, 0, len(assets))
	for _, obj := range assets {
		rows = append(rows, models.MaterialAsset{MaterialID: materialID, ObjectName: obj})
	}
	return tx.Create(&rows).Error
}

// ListAssetObjectNames mengembalikan object name aset content materi.
// Dipakai saat edit untuk mendeteksi gambar yang dihapus dari editor.
func (r *Repository) ListAssetObjectNames(materialID uint) ([]string, error) {
	var names []string
	if err := r.db.Model(&models.MaterialAsset{}).
		Where("material_id = ?", materialID).
		Pluck("object_name", &names).Error; err != nil {
		return nil, err
	}
	return names, nil
}

// DeleteWithAssets menghapus materi beserta aset content-nya secara HARD dalam
// satu transaksi. Mengembalikan object name aset yang ikut terhapus supaya
// caller bisa membersihkan object storage setelah commit.
func (r *Repository) DeleteWithAssets(id uint) ([]string, error) {
	var assetNames []string
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Model(&models.MaterialAsset{}).
			Where("material_id = ?", id).
			Pluck("object_name", &assetNames).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("material_id = ?", id).Delete(&models.MaterialAsset{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.Material{}, id).Error
	})
	if err != nil {
		return nil, err
	}
	return assetNames, nil
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.Material{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) CountByChapter(chapterID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Material{}).Where("chapter_id = ?", chapterID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
