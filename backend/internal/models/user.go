package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name          string  `gorm:"size:100;not null" json:"name"`
	Email         string  `gorm:"size:100;uniqueIndex;not null" json:"email"`
	GoogleID      string  `gorm:"size:100;uniqueIndex" json:"-"`
	AvatarURL     string  `gorm:"size:500" json:"avatar_url"`
	Password      *string `gorm:"size:255" json:"-"`
	Roles         []Role  `gorm:"many2many:user_roles;" json:"roles"`
	Subjects      []Subject `gorm:"many2many:teacher_subjects;" json:"subjects"`
	PaymentStatus string  `gorm:"size:20;default:pending" json:"payment_status"`
	// Izin kelola konten (teacher). Admin selalu bypass. Default false = guru
	// existing dicabut akses tulis; admin beri manual lewat UI.
	CanManageMaterials        bool `gorm:"default:false" json:"can_manage_materials"`
	CanManageQuestionPackages bool `gorm:"default:false" json:"can_manage_question_packages"`
	ClassID       *uint   `gorm:"default:null" json:"class_id"`
	Class         *Class  `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}
