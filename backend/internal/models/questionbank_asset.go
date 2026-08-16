package models

import "gorm.io/gorm"

// QuizQuestionAsset mencatat object name gambar yang ada di content soal &
// pembahasan (public/quiz_questions/...). Dipakai untuk mendeteksi gambar
// yang dihapus dari editor saat soal di-edit (diff dengan content baru).
type QuizQuestionAsset struct {
	gorm.Model
	QuestionID uint         `gorm:"not null;index" json:"question_id"`
	ObjectName string       `gorm:"size:255;not null" json:"object_name"`
	Question   QuizQuestion `gorm:"foreignKey:QuestionID" json:"-"`
}

func (QuizQuestionAsset) TableName() string { return "quiz_question_assets" }

// QuizAnswerAsset mencatat object name gambar yang ada di content opsi
// jawaban (public/quiz_answers/...). Dipakai untuk mendeteksi gambar yang
// dihapus saat jawaban diganti (diff dengan content baru).
type QuizAnswerAsset struct {
	gorm.Model
	AnswerID uint       `gorm:"not null;index" json:"answer_id"`
	ObjectName string   `gorm:"size:255;not null" json:"object_name"`
	Answer   QuizAnswer `gorm:"foreignKey:AnswerID" json:"-"`
}

func (QuizAnswerAsset) TableName() string { return "quiz_answer_assets" }