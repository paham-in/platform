package models

import "gorm.io/gorm"

// MaterialAsset mencatat object name gambar yang ada di content materi
// (public/materials/...). Dipakai untuk mendeteksi gambar yang dihapus
// dari editor saat materi di-edit (diff dengan content baru).
type MaterialAsset struct {
	gorm.Model
	MaterialID uint     `gorm:"not null;index" json:"material_id"`
	ObjectName string   `gorm:"size:255;not null" json:"object_name"`
	Material   Material `gorm:"foreignKey:MaterialID" json:"-"`
}

// TableName menimpa nama tabel GORM default (material_assets sudah benar,
// dipertahankan eksplisit biar konsisten dengan forum_question_assets).
func (MaterialAsset) TableName() string { return "material_assets" }