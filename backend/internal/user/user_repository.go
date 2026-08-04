package user

import (
	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Get(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.Preload("Roles").Preload("Subjects").First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Preload("Roles").Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) List() ([]models.User, error) {
	var users []models.User
	if err := r.db.Preload("Roles").Preload("Subjects").Order("created_at desc").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) UpdateRole(id uint, roles []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, id).Error; err != nil {
			return err
		}
		if err := tx.Model(&user).Association("Roles").Clear(); err != nil {
			return err
		}
		var roleModels []models.Role
		if err := tx.Where("name IN ?", roles).Find(&roleModels).Error; err != nil {
			return err
		}
		return tx.Model(&user).Association("Roles").Append(&roleModels)
	})
}

func (r *UserRepository) GetByGoogleID(googleID string) (*models.User, error) {
	var user models.User
	if err := r.db.Preload("Roles").Where("google_id = ?", googleID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdatePaymentStatus(id uint, status string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("payment_status", status).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *UserRepository) UpdateAvatar(id uint, avatarURL string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("avatar_url", avatarURL).Error
}

func (r *UserRepository) UpdateGoogleID(id uint, googleID string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("google_id", googleID).Error
}

func (r *UserRepository) UpdateName(id uint, name string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("name", name).Error
}

func (r *UserRepository) UpdateClassID(id uint, classID uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("class_id", classID).Error
}

func (r *UserRepository) SetTeacherSubjects(userID uint, subjectIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("user_id = ?", userID).Delete(&models.TeacherSubject{}).Error; err != nil {
			return err
		}
		if len(subjectIDs) == 0 {
			return nil
		}
		pivots := make([]models.TeacherSubject, len(subjectIDs))
		for i, sid := range subjectIDs {
			pivots[i] = models.TeacherSubject{UserID: userID, SubjectID: sid}
		}
		return tx.Create(&pivots).Error
	})
}
