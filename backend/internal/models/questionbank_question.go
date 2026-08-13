package models

import "gorm.io/gorm"

type QuizQuestion struct {
	gorm.Model
	UserID      uint         `gorm:"not null;index" json:"user_id"`
	User        User         `gorm:"foreignKey:UserID" json:"-"`
	PackageID   uint         `gorm:"not null;index" json:"package_id"`
	Package     QuizPackage  `gorm:"foreignKey:PackageID" json:"-"`
	Question    string       `gorm:"type:text;not null" json:"question"`
	Explanation string       `gorm:"type:text" json:"explanation"`
	Answers     []QuizAnswer `gorm:"foreignKey:QuestionID" json:"answers"`
}

// TableName override supaya GORM pake quiz_questions.
func (QuizQuestion) TableName() string { return "quiz_questions" }
