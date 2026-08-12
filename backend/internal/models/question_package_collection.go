package models

import "gorm.io/gorm"

// QuestionPackageCollection adalah bundel paket soal milik satu kelas.
// Tier free/premium ditaruh di koleksi, bukan di paket. Paket soal di dalamnya
// hanya membawa mata pelajaran (SubjectID).
type QuestionPackageCollection struct {
	gorm.Model
	Name         string             `gorm:"size:200;not null" json:"name"`
	ClassID      uint               `gorm:"not null;index" json:"class_id"`
	IsFree       bool               `gorm:"default:true;not null" json:"is_free"`
	Description  string             `gorm:"size:500" json:"description"`
	Packages     []QuestionPackage  `gorm:"foreignKey:CollectionID" json:"packages"`
	Class        Class              `gorm:"foreignKey:ClassID" json:"-"`
}

// TableName override supaya GORM pake question_package_collections.
func (QuestionPackageCollection) TableName() string {
	return "question_package_collections"
}
