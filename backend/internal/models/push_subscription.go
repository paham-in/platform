package models

import "gorm.io/gorm"

type PushSubscription struct {
	gorm.Model
	UserID   uint   `gorm:"not null;index" json:"user_id"`
	Endpoint string `gorm:"type:text;not null;unique" json:"endpoint"`
	KeysP256 string `gorm:"type:text;not null" json:"keys_p256dh"`
	KeysAuth string `gorm:"type:text;not null" json:"keys_auth"`
}
