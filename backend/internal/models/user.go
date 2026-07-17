package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name     string  `gorm:"size:100;not null" json:"name"`
	Email    string  `gorm:"size:100;uniqueIndex;not null" json:"email"`
	GoogleID string  `gorm:"size:100;uniqueIndex" json:"-"`
	Password *string `gorm:"size:255" json:"-"`
	Role     string  `gorm:"size:20;not null;default:student" json:"role"`
}
