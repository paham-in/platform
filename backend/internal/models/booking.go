package models

import "gorm.io/gorm"

type Booking struct {
	gorm.Model
	TeacherID    uint   `gorm:"not null;index" json:"teacher_id"`
	Teacher      *User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	StudentID    uint   `gorm:"not null;index" json:"student_id"`
	Student      *User  `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Date         string `gorm:"size:10;not null" json:"date"`        // "YYYY-MM-DD"
	StartTime    string `gorm:"size:5;not null" json:"start_time"`  // "HH:mm"
	EndTime      string `gorm:"size:5;not null" json:"end_time"`    // "HH:mm"
	Status       string `gorm:"size:20;default:pending" json:"status"` // pending/confirmed/rejected/cancelled
	Mode         string `gorm:"size:20;default:private" json:"mode"`   // private/semi_private
	SessionCount int    `gorm:"not null;default:1" json:"session_count"`
	GroupToken   string `gorm:"size:64;index" json:"group_token"`      // token undangan grup semi_private
	Note         string `gorm:"size:500" json:"note"`
	ClassID      *uint  `gorm:"index" json:"class_id,omitempty"`       // snapshot kelas murid saat booking
	Sessions     []TutoringSession `gorm:"foreignKey:BookingID" json:"sessions,omitempty"`
	Invoice      *Invoice          `gorm:"foreignKey:BookingID" json:"invoice,omitempty"`
}
