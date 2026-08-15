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

// UpdateEmail mengganti email user (dipakai utk menghubungkan akun dummy
// dengan email asli murid supaya login Google ter-link).
func (r *UserRepository) UpdateEmail(id uint, email string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("email", email).Error
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
func (r *UserRepository) hardDelete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		return r.hardDeleteTx(tx, id)
	})
}

// hardDeleteTx menghapus permanen beserta semua data yang merujuk user, dalam
// transaksi yang sudah dibuka. Dipakai hardDelete dan Merge (biar atomic).
// Urutan penting: hapus child dulu sebelum user (FK constraint), pakai Unscoped
// biar baris yang sudah soft-deleted ikut terhapus.
func (r *UserRepository) hardDeleteTx(tx *gorm.DB, id uint) error {
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
	// booking les privat (sebagai teacher atau student) — hapus dulu sesi &
	// invoice yang merujuk booking-nya (FK constraint), lalu booking itu sendiri.
	var bid []uint
	if err := tx.Model(&models.Booking{}).Unscoped().
		Where("teacher_id = ? OR student_id = ?", id, id).
		Pluck("id", &bid).Error; err != nil {
		return err
	}
	if len(bid) > 0 {
		if err := tx.Unscoped().Where("booking_id IN ?", bid).Delete(&models.TutoringSession{}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("booking_id IN ?", bid).Delete(&models.Invoice{}).Error; err != nil {
			return err
		}
	}
	if err := tx.Unscoped().Where("teacher_id = ? OR student_id = ?", id, id).Delete(&models.Booking{}).Error; err != nil {
		return err
	}
	// pertanyaan forum milik user + gambar & jawabannya
	var qids []uint
	tx.Model(&models.ForumQuestion{}).Where("user_id = ?", id).Pluck("id", &qids)
	if len(qids) > 0 {
		if err := tx.Unscoped().Where("question_id IN ?", qids).Delete(&models.ForumQuestionImage{}).Error; err != nil {
			return err
		}
		var ansIDs []uint
		tx.Model(&models.ForumAnswer{}).Unscoped().Where("question_id IN ?", qids).Pluck("id", &ansIDs)
		if len(ansIDs) > 0 {
			if err := tx.Unscoped().Where("answer_id IN ?", ansIDs).Delete(&models.ForumAnswerImage{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("question_id IN ?", qids).Delete(&models.ForumAnswer{}).Error; err != nil {
			return err
		}
	}
	if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.ForumQuestion{}).Error; err != nil {
		return err
	}
	// jawaban yang user tulis di pertanyaan orang lain
	var ownAnsIDs []uint
	tx.Model(&models.ForumAnswer{}).Unscoped().Where("user_id = ?", id).Pluck("id", &ownAnsIDs)
	if len(ownAnsIDs) > 0 {
		if err := tx.Unscoped().Where("answer_id IN ?", ownAnsIDs).Delete(&models.ForumAnswerImage{}).Error; err != nil {
			return err
		}
	}
	if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.ForumAnswer{}).Error; err != nil {
		return err
	}
	// soal bank soal milik user + jawabannya
	var pqids []uint
	tx.Model(&models.QuizQuestion{}).Where("user_id = ?", id).Pluck("id", &pqids)
	if len(pqids) > 0 {
		if err := tx.Unscoped().Where("question_id IN ?", pqids).Delete(&models.QuizAnswer{}).Error; err != nil {
			return err
		}
	}
	if err := tx.Unscoped().Where("user_id = ?", id).Delete(&models.QuizQuestion{}).Error; err != nil {
		return err
	}
	// materi yang dibuat user (teacher)
	if err := tx.Unscoped().Where("author_id = ?", id).Delete(&models.Material{}).Error; err != nil {
		return err
	}

	// user itu sendiri
	return tx.Unscoped().Delete(&models.User{}, id).Error
}

// Merge memindahkan data milik akun dummy (booking, invoice, akses kelas,
// langganan push, forum) ke akun target lalu menghapus akun dummy.
// Satu transaksi — kalau satu langkah gagal, semua batal (atomic).
func (r *UserRepository) Merge(dummyID, targetID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var dummy, target models.User
		if err := tx.First(&dummy, dummyID).Error; err != nil {
			return err
		}
		if err := tx.First(&target, targetID).Error; err != nil {
			return err
		}
		moves := []struct {
			model interface{}
			col   string
		}{
			{&models.Booking{}, "student_id"},
			{&models.Invoice{}, "user_id"},
			{&models.StudentClass{}, "user_id"},
			{&models.PushSubscription{}, "user_id"},
			{&models.ForumQuestion{}, "user_id"},
			{&models.ForumAnswer{}, "user_id"},
		}
		for _, m := range moves {
			// Unscoped: booking/invoice dll yang sudah soft-deleted ikut kepindah,
			// biar tidak tersisa utk dihapus (data hilang).
			if err := tx.Model(m.model).Unscoped().Where(m.col+" = ?", dummyID).Update(m.col, targetID).Error; err != nil {
				return err
			}
		}
		return r.hardDeleteTx(tx, dummyID)
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

// UpdatePermissions mengubah izin kelola konten (materi / paket soal) user.
// updates dipakai map field yang diset saja (nilai dari request).
func (r *UserRepository) UpdatePermissions(id uint, updates map[string]any) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error
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
