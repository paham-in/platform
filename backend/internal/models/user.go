package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name          string  `gorm:"size:100;not null" json:"name"`
	Email         string  `gorm:"size:100;uniqueIndex;not null" json:"email"`
	GoogleID      string  `gorm:"size:100;uniqueIndex" json:"-"`
	AvatarURL     string  `gorm:"size:500" json:"avatar_url"`
	Password      *string `gorm:"size:255" json:"-"`
	Roles         []Role  `gorm:"many2many:user_roles;" json:"roles"`
	PaymentStatus string  `gorm:"size:20;default:pending" json:"payment_status"`
	ClassID       *uint   `gorm:"default:null" json:"class_id"`
	Class         *Class  `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}
