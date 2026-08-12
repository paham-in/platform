package models

import "gorm.io/gorm"

// QuestionPackageGroup adalah bundel paket soal milik satu kelas.
// Tier free/premium ditaruh di grup, bukan di paket. Paket soal di dalamnya
// hanya membawa mata pelajaran (SubjectID).
type QuestionPackageGroup struct {
	gorm.Model
	Name        string            `gorm:"size:200;not null" json:"name"`
	ClassID     uint              `gorm:"not null;index" json:"class_id"`
	IsFree      bool              `gorm:"default:true;not null" json:"is_free"`
	Description string            `gorm:"size:500" json:"description"`
	Packages    []QuestionPackage `gorm:"foreignKey:GroupID" json:"packages"`
	Class       Class             `gorm:"foreignKey:ClassID" json:"-"`
}
