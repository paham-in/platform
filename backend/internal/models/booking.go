package models

import "gorm.io/gorm"

type Booking struct {
	gorm.Model
	TeacherID   uint   `gorm:"not null;index" json:"teacher_id"`
	Teacher     *User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	StudentID   uint   `gorm:"not null;index" json:"student_id"`
	Student     *User  `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Date        string `gorm:"size:10;not null" json:"date"`        // "YYYY-MM-DD"
	StartTime   string `gorm:"size:5;not null" json:"start_time"`  // "HH:mm"
	EndTime     string `gorm:"size:5;not null" json:"end_time"`    // "HH:mm"
	Status      string `gorm:"size:20;default:pending" json:"status"` // pending/confirmed/rejected/cancelled
	Note        string `gorm:"size:500" json:"note"`
}
