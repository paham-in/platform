package models

import "gorm.io/gorm"

type Class struct {
	gorm.Model
	PublicID        string  `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	Name            string  `gorm:"size:100;not null" json:"name"`
	Slug            string  `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ProgramID       *uint   `gorm:"index" json:"program_id,omitempty"`
	AllowTutoring   bool    `gorm:"default:true" json:"allow_tutoring"`    // true = bisa booking les, false = cuma materi
	PricePerSession float64 `gorm:"default:0" json:"price_per_session"`  // biaya per pertemuan les privat
	GroupPrice      float64 `gorm:"default:0" json:"group_price"`        // biaya per pertemuan les kelompok
	ContentPrice    float64 `gorm:"default:0" json:"content_price"`      // harga langganan konten (materi + paket soal + forum) per kelas
}

func (c *Class) BeforeCreate(tx *gorm.DB) error {
	if c.PublicID == "" {
		c.PublicID = NewPublicID()
	}
	return nil
}
