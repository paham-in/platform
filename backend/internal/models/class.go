package models

import "gorm.io/gorm"

type Class struct {
	gorm.Model
	Name            string  `gorm:"size:100;not null" json:"name"`
	Slug            string  `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ProgramID       *uint   `gorm:"index" json:"program_id,omitempty"`
	PricePerSession float64 `gorm:"default:0" json:"price_per_session"` // biaya per pertemuan les privat
	GroupPrice      float64 `gorm:"default:0" json:"group_price"`       // biaya per pertemuan les kelompok
	ContentPrice    float64 `gorm:"default:0" json:"content_price"`     // harga langganan konten (materi + paket soal + forum) per kelas
}
