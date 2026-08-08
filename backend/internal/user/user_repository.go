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

func (r *UserRepository) List(search string, role string) ([]models.User, error) {
	query := r.db.Preload("Roles").Preload("Subjects").Order("created_at desc")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}

	if role != "" {
		query = query.Where("EXISTS (SELECT 1 FROM user_roles JOIN roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = users.id AND roles.name = ?)", role)
	}

	var users []models.User
	if err := query.Find(&users).Error; err != nil {
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

// Delete menghapus user. Role teacher di-soft delete dulu (kebijakan belum final);
// role lain (user/student) di-hard delete beserta semua data yang merujuk padanya.
func (r *UserRepository) Delete(id uint) error {
	var user models.User
	if err := r.db.Preload("Roles").First(&user, id).Error; err != nil {
		return err
	}
	for _, role := range user.Roles {
		if role.Name == "teacher" {
			return r.db.Delete(&models.User{}, id).Error // soft delete
		}
	}
	return r.hardDelete(id)
}

// hardDelete menghapus permanen beserta semua data yang merujuk user.
// Urutan penting: hapus child dulu sebelum user (FK constraint), pakai Unscoped
// biar baris yang sudah soft-deleted ikut terhapus.
func (r *UserRepository) hardDelete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// sesi login
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.Session{}).Error; err != nil {
			return err
		}
		// pivot many2many roles
		if err := tx.Exec("DELETE FROM user_roles WHERE user_id = ?", id).Error; err != nil {
			return err
		}
		// mata pelajaran yang diajar (teacher)
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.TeacherSubject{}).Error; err != nil {
			return err
		}
		// gambar subjek milik user
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.SubjectImage{}).Error; err != nil {
			return err
		}
		// langganan push notifikasi
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.PushSubscription{}).Error; err != nil {
			return err
		}
		// invoice pembayaran
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.Invoice{}).Error; err != nil {
			return err
		}
		// jadwal les privat (teacher)
		if err := tx.Unscoped().Where("teacher_id = ?", id).Delete(&models.Availability{}).Error; err != nil {
			return err
		}
		// booking les privat (sebagai teacher atau student)
		if err := tx.Unscoped().Where("teacher_id = ? OR student_id = ?", id, id).Delete(&models.Booking{}).Error; err != nil {
			return err
		}
		// pertanyaan forum milik user + gambar & jawabannya
		var qids []uint
		tx.Model(&models.Question{}).Where("user_id = ?", id).Pluck("id", &qids)
		if len(qids) > 0 {
			if err := tx.Unscoped().Where("question_id IN ?", qids).Delete(&models.QuestionImage{}).Error; err != nil {
				return err
			}
			if err := tx.Unscoped().Where("question_id IN ?", qids).Delete(&models.Answer{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.Question{}).Error; err != nil {
			return err
		}
		// jawaban yang user tulis di pertanyaan orang lain
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.Answer{}).Error; err != nil {
			return err
		}
		// soal bank soal milik user + jawabannya
		var pqids []uint
		tx.Model(&models.QuestionbankQuestion{}).Where("user_id = ?", id).Pluck("id", &pqids)
		if len(pqids) > 0 {
			if err := tx.Unscoped().Where("question_id IN ?", pqids).Delete(&models.QuestionbankAnswer{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.QuestionbankQuestion{}).Error; err != nil {
			return err
		}
		// materi yang dibuat user (teacher)
		if err := tx.Unscoped().Where("author_id = ?", id).Delete(&models.Material{}).Error; err != nil {
			return err
		}

		// user itu sendiri
		return tx.Unscoped().Delete(&models.User{}, id).Error
	})
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
