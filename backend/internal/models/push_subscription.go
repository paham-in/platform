package models

import "gorm.io/gorm"

type PushSubscription struct {
	gorm.Model
	UserID   uint   `gorm:"not null;index;uniqueIndex:uni_push_subscriptions_user_endpoint,priority:1" json:"user_id"`
	Endpoint string `gorm:"type:text;not null;uniqueIndex:uni_push_subscriptions_user_endpoint,priority:2" json:"endpoint"`
	KeysP256 string `gorm:"type:text;not null" json:"keys_p256dh"`
	KeysAuth string `gorm:"type:text;not null" json:"keys_auth"`
}
