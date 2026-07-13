package models

import "gorm.io/gorm"

type Session struct {
	gorm.Model
	UserID    uint   `gorm:"index;not null" json:"user_id"`
	Token     string `gorm:"size:255;uniqueIndex;not null" json:"token"`
	ExpiresAt int64  `gorm:"not null" json:"expires_at"` // unix timestamp
}
