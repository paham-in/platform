package models

import "gorm.io/gorm"

type QuizPackage struct {
	gorm.Model
	PublicID     string         `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	Name         string         `gorm:"size:200;not null" json:"name"`
	AuthorID     uint           `gorm:"index" json:"author_id,omitempty"`
	Description  string         `gorm:"size:500" json:"description"`
	SubjectID    uint           `gorm:"not null;default:0;index" json:"subject_id"`
	IsFree       bool           `gorm:"default:true;not null" json:"is_free"`
	// draft | published, paket baru dibuat draft dulu, baru dipublish saat siap.
	Status       string         `gorm:"size:20;default:draft" json:"status"`
	CollectionID *uint          `gorm:"index" json:"collection_id,omitempty"`
	Questions    []QuizQuestion `gorm:"foreignKey:PackageID" json:"questions"`
	Subject      Subject        `gorm:"foreignKey:SubjectID" json:"-"`
	Collection   QuizCollection `gorm:"foreignKey:CollectionID" json:"-"`
}

func (p *QuizPackage) BeforeCreate(tx *gorm.DB) error {
	if p.PublicID == "" {
		p.PublicID = NewPublicID()
	}
	return nil
}

// TableName override supaya GORM pake quiz_packages.
func (QuizPackage) TableName() string { return "quiz_packages" }
