package models

import "gorm.io/gorm"

type QuizQuestion struct {
	gorm.Model
	PublicID    string       `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	UserID      uint         `gorm:"not null;index" json:"user_id"`
	User        User         `gorm:"foreignKey:UserID" json:"-"`
	PackageID   uint         `gorm:"not null;index" json:"package_id"`
	Package     QuizPackage  `gorm:"foreignKey:PackageID" json:"-"`
	Question    string       `gorm:"type:text;not null" json:"question"`
	Explanation string       `gorm:"type:text" json:"explanation"`
	Answers     []QuizAnswer `gorm:"foreignKey:QuestionID" json:"answers"`
}

func (q *QuizQuestion) BeforeCreate(tx *gorm.DB) error {
	if q.PublicID == "" {
		q.PublicID = NewPublicID()
	}
	return nil
}

// TableName override supaya GORM pake quiz_questions.
func (QuizQuestion) TableName() string { return "quiz_questions" }
