package models

import "gorm.io/gorm"

type Chapter struct {
	gorm.Model
	PublicID    string  `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	ClassID     uint    `gorm:"not null;uniqueIndex:idx_class_subject_slug" json:"class_id"`
	SubjectID   uint    `gorm:"not null;uniqueIndex:idx_class_subject_slug" json:"subject_id"`
	Title       string  `gorm:"size:200;not null" json:"title"`
	Slug        string  `gorm:"size:200;uniqueIndex:idx_class_subject_slug;not null" json:"slug"`
	Description string  `gorm:"size:500" json:"description"`
	CoverURL    string  `gorm:"size:500" json:"cover_url"`
	Order       int     `gorm:"default:0" json:"order"`
	Class       Class   `gorm:"foreignKey:ClassID" json:"-"`
	Subject     Subject `gorm:"foreignKey:SubjectID" json:"-"`
}

func (c *Chapter) BeforeCreate(tx *gorm.DB) error {
	if c.PublicID == "" {
		c.PublicID = NewPublicID()
	}
	return nil
}
