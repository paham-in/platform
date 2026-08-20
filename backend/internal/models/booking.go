package models

import "gorm.io/gorm"

type Booking struct {
	gorm.Model
	PublicID     string `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	TeacherID    *uint  `gorm:"index" json:"teacher_id"`                    // nil = belum ada guru, ditangani admin
	Teacher      *User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	StudentID    uint   `gorm:"not null;index" json:"student_id"`
	Student      *User  `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	SubjectID    uint   `gorm:"not null;default:0;index" json:"subject_id"`           // mapel yang murid mau
	Subject      *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Date         string `gorm:"size:10;not null" json:"date"`        // "YYYY-MM-DD"
	StartTime    string `gorm:"size:5;not null" json:"start_time"`  // "HH:mm"
	EndTime      string `gorm:"size:5;not null" json:"end_time"`    // "HH:mm"
	Status       string `gorm:"size:20;default:pending" json:"status"` // pending/confirmed/rejected/cancelled
	Mode         string `gorm:"size:20;default:private" json:"mode"`   // private/group
	SessionCount int    `gorm:"not null;default:1" json:"session_count"`
	GroupToken   string `gorm:"size:64;index" json:"group_token"`      // token undangan grup
	Note         string `gorm:"size:500" json:"note"`
	ClassID      *uint  `gorm:"index" json:"class_id,omitempty"`       // snapshot kelas murid saat booking
	Sessions     []TutoringSession `gorm:"foreignKey:BookingID" json:"sessions,omitempty"`
	Invoice      *Invoice          `gorm:"foreignKey:BookingID" json:"invoice,omitempty"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	if b.PublicID == "" {
		b.PublicID = NewPublicID()
	}
	return nil
}
