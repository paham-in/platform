package models

import "gorm.io/gorm"

// TeacherPermission menyimpan hak akses guru secara terpisah dari profil user.
// One-to-one dengan User (uniqueIndex di user_id).
type TeacherPermission struct {
	gorm.Model
	UserID                   uint `gorm:"uniqueIndex;not null" json:"user_id"`
	CanManageMaterials       bool `gorm:"default:false" json:"can_manage_materials"`
	CanManageQuestionPackages bool `gorm:"default:false" json:"can_manage_question_packages"`
}

func (TeacherPermission) TableName() string { return "teacher_permissions" }
