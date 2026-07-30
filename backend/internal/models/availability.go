package models

import "gorm.io/gorm"

type Availability struct {
	gorm.Model
	TeacherID uint   `gorm:"not null;index" json:"teacher_id"`
	Teacher   *User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	DayOfWeek int    `gorm:"not null" json:"day_of_week"` // 0=Sun,1=Mon..6=Sat
	StartTime string `gorm:"size:5;not null" json:"start_time"` // "HH:mm"
	EndTime   string `gorm:"size:5;not null" json:"end_time"`   // "HH:mm"
}
