package models

import (
	"time"

	"gorm.io/gorm"
)

// SessionTTL adalah umur sesi. Dipakai untuk sliding expiration:
// tiap kali token dipakai, ExpiresAt diperpanjang ke sekarang + SessionTTL.
const SessionTTL = 7 * 24 * time.Hour

type Session struct {
	gorm.Model
	UserID    uint   `gorm:"index;not null" json:"user_id"`
	Token     string `gorm:"size:255;uniqueIndex;not null" json:"token"`
	ExpiresAt int64  `gorm:"not null" json:"expires_at"` // unix timestamp
}
