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
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) List() ([]models.User, error) {
	var users []models.User
	if err := r.db.Order("created_at desc").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) UpdateRole(id uint, role string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("role", role).Error
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

func (r *UserRepository) GetByGoogleID(googleID string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("google_id = ?", googleID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
