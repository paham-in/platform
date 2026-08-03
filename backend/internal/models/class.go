package models

import "gorm.io/gorm"

type Class struct {
	gorm.Model
	Name string `gorm:"size:100;not null" json:"name"`
	Slug string `gorm:"size:100;uniqueIndex;not null" json:"slug"`
}
