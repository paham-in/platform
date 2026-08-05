package models

import "gorm.io/gorm"

type QuestionPackage struct {
	gorm.Model
	Name        string         `gorm:"size:200;not null" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	Questions   []QuestionbankQuestion `gorm:"many2many:package_questions;joinReferences:QuestionBankID" json:"questions"`
}
