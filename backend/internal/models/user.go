package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	PublicID     string    `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Email        string    `gorm:"size:100;uniqueIndex;not null" json:"email"`
	// GoogleID pointer supaya NULL (bukan '') untuk user non-Google.
	// Keunikan dipegang partial index migrasi 000042 (NULL boleh banyak).
	GoogleID     *string   `gorm:"size:100" json:"-"`
	AvatarURL    string    `gorm:"size:500" json:"avatar_url"`
	Password     *string   `gorm:"size:255" json:"-"`
	Phone        string    `gorm:"size:20" json:"phone"`
	Roles        []Role    `gorm:"many2many:user_roles;" json:"roles"`
	Subjects     []Subject `gorm:"many2many:teacher_subjects;" json:"subjects"`
	TeacherPermission *TeacherPermission `gorm:"foreignKey:UserID" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.PublicID == "" {
		u.PublicID = NewPublicID()
	}
	return nil
}

// HasGoogle true bila user terhubung ke akun Google (google_id terisi).
func (u User) HasGoogle() bool {
	return u.GoogleID != nil && *u.GoogleID != ""
}
