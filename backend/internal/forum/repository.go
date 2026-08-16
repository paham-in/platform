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

func (r *Repository) List(subjectID, userID *uint, unanswered bool, search string) ([]models.ForumQuestion, error) {
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
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("plain_content ILIKE ? OR EXISTS (SELECT 1 FROM users WHERE users.id = forum_questions.user_id AND users.name ILIKE ?)", like, like)
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

// CreateWithAssets menyimpan pertanyaan + aset content (forum_question_assets)
// dalam satu transaksi.
func (r *Repository) CreateWithAssets(q *models.ForumQuestion, assets []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(q).Error; err != nil {
			return err
		}
		return insertAssets(tx, q.ID, assets)
	})
}

// UpdateContentWithAssets memperbarui content pertanyaan + mengganti daftar
// aset content (hapus semua, insert ulang) dalam satu transaksi. Aset dihapus
// secara HARD (Unscoped) — row aset adalah data turunan, bukan data user yang
// butuh audit, jadi tidak perlu soft delete.
func (r *Repository) UpdateContentWithAssets(id uint, content, plainContent string, subjectID *uint, assets []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.ForumQuestion{}).Where("id = ?", id).Updates(map[string]any{
			"content":       content,
			"plain_content": plainContent,
			"subject_id":    subjectID,
		}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("question_id = ?", id).Delete(&models.ForumQuestionAsset{}).Error; err != nil {
			return err
		}
		return insertAssets(tx, id, assets)
	})
}

func insertAssets(tx *gorm.DB, questionID uint, assets []string) error {
	if len(assets) == 0 {
		return nil
	}
	rows := make([]models.ForumQuestionAsset, 0, len(assets))
	for _, obj := range assets {
		rows = append(rows, models.ForumQuestionAsset{QuestionID: questionID, ObjectName: obj})
	}
	return tx.Create(&rows).Error
}

// ListAssetObjectNames mengembalikan object name aset content pertanyaan.
// Dipakai saat edit untuk mendeteksi gambar yang dihapus dari editor.
func (r *Repository) ListAssetObjectNames(questionID uint) ([]string, error) {
	var names []string
	if err := r.db.Model(&models.ForumQuestionAsset{}).
		Where("question_id = ?", questionID).
		Pluck("object_name", &names).Error; err != nil {
		return nil, err
	}
	return names, nil
}

// DeleteHard menghapus pertanyaan beserta jawaban & aset content-nya (soal &
// jawaban) secara HARD delete dalam satu transaksi. Mengembalikan nama file
// gambar yang ikut terhapus supaya caller bisa membersihkan object storage
// setelah commit. Semua pakai Unscoped supaya baris yang sudah soft-deleted pun
// ikut dibersihkan.
func (r *Repository) DeleteHard(id uint) ([]string, error) {
	var fileNames []string
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// kumpulkan nama file dulu (sebelum barisnya dihapus).
		var assetNames []string
		if err := tx.Unscoped().Model(&models.ForumQuestionAsset{}).
			Where("question_id = ?", id).
			Pluck("object_name", &assetNames).Error; err != nil {
			return err
		}
		var answerIDs []uint
		if err := tx.Unscoped().Model(&models.ForumAnswer{}).
			Where("question_id = ?", id).
			Pluck("id", &answerIDs).Error; err != nil {
			return err
		}
		var answerAssetNames []string
		if len(answerIDs) > 0 {
			if err := tx.Unscoped().Model(&models.ForumAnswerAsset{}).
				Where("answer_id IN ?", answerIDs).
				Pluck("object_name", &answerAssetNames).Error; err != nil {
				return err
			}
		}
		fileNames = append(fileNames, assetNames...)
		fileNames = append(fileNames, answerAssetNames...)
		// hapus anak dulu (FK constraint), lalu pertanyaannya.
		if err := tx.Unscoped().Where("question_id = ?", id).Delete(&models.ForumAnswer{}).Error; err != nil {
			return err
		}
		if len(answerIDs) > 0 {
			if err := tx.Unscoped().Where("answer_id IN ?", answerIDs).Delete(&models.ForumAnswerAsset{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("question_id = ?", id).Delete(&models.ForumQuestionAsset{}).Error; err != nil {
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


