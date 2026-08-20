package models

import "gorm.io/gorm"

type Subject struct {
	gorm.Model
	PublicID  string `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	Name      string `gorm:"size:100;not null" json:"name"`
	Slug      string `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ProgramID *uint  `gorm:"index" json:"program_id,omitempty"`
}

func (s *Subject) BeforeCreate(tx *gorm.DB) error {
	if s.PublicID == "" {
		s.PublicID = NewPublicID()
	}
	return nil
}
