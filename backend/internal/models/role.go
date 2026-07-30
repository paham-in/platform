package models

import "gorm.io/gorm"

type Role struct {
	gorm.Model
	Name string `gorm:"size:20;uniqueIndex;not null" json:"name"`
	Users []User `gorm:"many2many:user_roles;" json:"-"`
}
