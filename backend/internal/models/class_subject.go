package models

import "gorm.io/gorm"

type ClassSubject struct {
	gorm.Model
	ClassID   uint `gorm:"not null;index;uniqueIndex:idx_class_subject" json:"class_id"`
	SubjectID uint `gorm:"not null;index;uniqueIndex:idx_class_subject" json:"subject_id"`
	Class     Class   `gorm:"foreignKey:ClassID" json:"-"`
	Subject   Subject `gorm:"foreignKey:SubjectID" json:"-"`
}
