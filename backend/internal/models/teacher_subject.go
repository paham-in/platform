package models

import "gorm.io/gorm"

type TeacherSubject struct {
	gorm.Model
	UserID    uint    `gorm:"not null;index;uniqueIndex:idx_teacher_subject" json:"user_id"`
	SubjectID uint    `gorm:"not null;index;uniqueIndex:idx_teacher_subject" json:"subject_id"`
	User      User    `gorm:"foreignKey:UserID" json:"-"`
	Subject   Subject `gorm:"foreignKey:SubjectID" json:"-"`
}
