package models

import "gorm.io/gorm"

type Notification struct {
	gorm.Model
	PublicID string `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	UserID   uint   `gorm:"not null;index" json:"user_id"`
	Title    string `gorm:"size:255;not null" json:"title"`
	Body     string `gorm:"type:text;not null" json:"body"`
	Type     string `gorm:"size:50;not null;index" json:"type"`
	URL      string `gorm:"size:500;not null;default:''" json:"url"`
	IsRead   bool   `gorm:"not null;default:false;index" json:"is_read"`
	User     User   `gorm:"foreignKey:UserID" json:"-"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.PublicID == "" {
		n.PublicID = NewPublicID()
	}
	return nil
}
