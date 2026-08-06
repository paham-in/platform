package models

import "gorm.io/gorm"

type QuestionPackage struct {
	gorm.Model
	Name        string                 `gorm:"size:200;not null" json:"name"`
	Description string                 `gorm:"size:500" json:"description"`
	Questions   []QuestionbankQuestion `gorm:"foreignKey:PackageID" json:"questions"`
}
