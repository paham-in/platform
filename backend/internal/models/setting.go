package models

import "gorm.io/gorm"

// Setting = konfigurasi aplikasi yang bisa diubah lewat UI admin (key-value).
type Setting struct {
	gorm.Model
	Key   string `gorm:"size:100;uniqueIndex:idx_settings_key,where:deleted_at IS NULL;not null" json:"key"`
	Value string `gorm:"type:text;not null" json:"value"`
}
