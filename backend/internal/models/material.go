package models

import "gorm.io/gorm"

type Material struct {
	gorm.Model
	PublicID    string  `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	ChapterID   uint    `gorm:"not null;index" json:"chapter_id"`
	AuthorID    uint    `gorm:"not null;index" json:"author_id"`
	Title       string  `gorm:"size:200;not null" json:"title"`
	Slug        string  `gorm:"size:200;uniqueIndex;not null" json:"slug"`
	Description string  `gorm:"size:500" json:"description"`
	Type        string  `gorm:"size:20;default:text" json:"type"` // text | video
	Content     string  `gorm:"type:text" json:"content"`
	VideoURL    string  `gorm:"size:500" json:"video_url"`
	Status      string  `gorm:"size:20;default:draft" json:"status"`
	// tanpa default di tag GORM: kalau default:true, GORM mengganti nilai zero
	// (false) dengan true saat Create, jadi materi premium tak pernah tersimpan.
	// Default TRUE di kolom DB hanya berlaku utk migrasi konten lama.
	IsFree  bool    `gorm:"not null" json:"is_free"`
	Order   int     `gorm:"default:0" json:"order"`
	Chapter Chapter `gorm:"foreignKey:ChapterID" json:"-"`
}

func (m *Material) BeforeCreate(tx *gorm.DB) error {
	if m.PublicID == "" {
		m.PublicID = NewPublicID()
	}
	return nil
}
