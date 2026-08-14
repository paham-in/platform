package models

import "gorm.io/gorm"

// QuizCollection adalah bundel paket soal milik satu kelas.
// Tier free/premium ditaruh di koleksi, bukan di paket. Paket soal di dalamnya
// hanya membawa mata pelajaran (SubjectID).
type QuizCollection struct {
	gorm.Model
	Name        string        `gorm:"size:200;not null" json:"name"`
	ClassID     uint          `gorm:"not null;index" json:"class_id"`
	// tanpa default di tag GORM: kalau default:true, GORM mengganti nilai zero
	// (false) dengan true saat Create, jadi koleksi premium tak pernah tersimpan.
	IsFree      bool          `gorm:"not null" json:"is_free"`
	Description string        `gorm:"size:500" json:"description"`
	Packages    []QuizPackage `gorm:"foreignKey:CollectionID" json:"packages"`
	Class       Class         `gorm:"foreignKey:ClassID" json:"-"`
}

// TableName override supaya GORM pake quiz_collections.
func (QuizCollection) TableName() string {
	return "quiz_collections"
}
