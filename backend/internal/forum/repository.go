package forum

import (
	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(subjectID, userID *uint, unanswered bool) ([]models.ForumQuestion, error) {
	var questions []models.ForumQuestion
	q := r.db.
		Preload("User").
		Preload("Subject").
		Preload("Answers", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at desc").Preload("User")
		})
	if subjectID != nil {
		q = q.Where("subject_id = ?", *subjectID)
	}
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	}
	if unanswered {
		q = q.Where("NOT EXISTS (SELECT 1 FROM forum_answers WHERE forum_answers.question_id = forum_questions.id)")
	}
	if err := q.Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) GetByID(id uint) (*models.ForumQuestion, error) {
	var q models.ForumQuestion
	if err := r.db.
		Preload("User").
		Preload("Subject").
		Preload("Answers", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at desc").Preload("User")
		}).
		First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) Create(q *models.ForumQuestion) error {
	return r.db.Create(q).Error
}

// DeleteHard menghapus pertanyaan beserta jawaban & gambarnya secara HARD
// delete dalam satu transaksi. Mengembalikan nama file gambar yang ikut
// terhapus supaya caller bisa membersihkan object storage setelah commit.
// Semua pakai Unscoped supaya baris yang sudah soft-deleted pun ikut dibersihkan.
func (r *Repository) DeleteHard(id uint) ([]string, error) {
	var fileNames []string
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// kumpulkan nama file gambar dulu (sebelum barisnya dihapus).
		if err := tx.Unscoped().Model(&models.ForumQuestionImage{}).
			Where("question_id = ?", id).
			Pluck("file_name", &fileNames).Error; err != nil {
			return err
		}
		// hapus anak dulu (FK constraint), lalu pertanyaannya.
		if err := tx.Unscoped().Where("question_id = ?", id).Delete(&models.ForumAnswer{}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("question_id = ?", id).Delete(&models.ForumQuestionImage{}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Delete(&models.ForumQuestion{}, id).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return fileNames, nil
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}


