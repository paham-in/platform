package models

import "gorm.io/gorm"

// Program adalah kelompok kelas (mis. "Sekolah" punya kelas 10,11,12; "UTBK").
type Program struct {
	gorm.Model
	PublicID string `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	Name     string `gorm:"size:100;not null" json:"name"`
	Slug     string `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Desc     string `gorm:"size:500" json:"description"`
}

func (p *Program) BeforeCreate(tx *gorm.DB) error {
	if p.PublicID == "" {
		p.PublicID = NewPublicID()
	}
	return nil
}
