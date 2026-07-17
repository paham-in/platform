package models

import "gorm.io/gorm"

type Subject struct {
	gorm.Model
	Name        string `gorm:"size:100;not null" json:"name"`
	Slug        string `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Description string `gorm:"size:500" json:"description"`
}
