package questionbank

import (
	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetPackage mengambil paket pemilik soal (utk cek kepemilikan di service).
func (r *Repository) GetPackage(id uint) (*models.QuizPackage, error) {
	var pkg models.QuizPackage
	if err := r.db.First(&pkg, id).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

func (r *Repository) ListByPackage(packageID uint, search string) ([]models.QuizQuestion, error) {
	var questions []models.QuizQuestion
	q := r.db.Preload("User").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Where("package_id = ?", packageID)
	if search != "" {
		q = q.Where("question ILIKE ?", "%"+search+"%")
	}
	if err := q.Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Get(id uint) (*models.QuizQuestion, error) {
	var q models.QuizQuestion
	if err := r.db.Preload("User").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

// CreateWithAssets menyimpan soal + jawaban + aset gambar (soal/pembahasan dan
// per-jawaban) dalam satu transaksi. answerAssets sejajar dengan q.Answers
// (jawaban kosong sudah disaring di service).
func (r *Repository) CreateWithAssets(q *models.QuizQuestion, questionAssets []string, answerAssets [][]string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(q).Error; err != nil {
			return err
		}
		for _, obj := range questionAssets {
			if err := tx.Create(&models.QuizQuestionAsset{QuestionID: q.ID, ObjectName: obj}).Error; err != nil {
				return err
			}
		}
		for i, ans := range q.Answers {
			for _, obj := range answerAssets[i] {
				if err := tx.Create(&models.QuizAnswerAsset{AnswerID: ans.ID, ObjectName: obj}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// UpdateWithAssets mengubah field soal + mengganti aset gambar & jawaban dalam
// satu transaksi — kalau salah satu gagal, semua ikut batal. answers == nil
// berarti jawaban tidak diubah (questionAssets boleh diganti sendiri);
// questionAssets == nil berarti aset soal/pembahasan tidak diubah.
func (r *Repository) UpdateWithAssets(questionID uint, updates map[string]any, answers []QuizAnswerInput, questionAssets []string, answerAssets [][]string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(&models.QuizQuestion{}).Where("id = ?", questionID).Updates(updates).Error; err != nil {
				return err
			}
		}
		if questionAssets != nil {
			if err := tx.Unscoped().Where("question_id = ?", questionID).Delete(&models.QuizQuestionAsset{}).Error; err != nil {
				return err
			}
			for _, obj := range questionAssets {
				if err := tx.Create(&models.QuizQuestionAsset{QuestionID: questionID, ObjectName: obj}).Error; err != nil {
					return err
				}
			}
		}
		if answers == nil {
			return nil
		}
		// hard-delete aset jawaban lama (jawaban lama di-soft-delete di bawah)
		if err := tx.Unscoped().Where("answer_id IN (SELECT id FROM quiz_answers WHERE question_id = ?)", questionID).Delete(&models.QuizAnswerAsset{}).Error; err != nil {
			return err
		}
		return r.replaceAnswersTx(tx, questionID, answers, answerAssets)
	})
}

func (r *Repository) replaceAnswersTx(db *gorm.DB, questionID uint, answers []QuizAnswerInput, answerAssets [][]string) error {
	if err := db.Where("question_id = ?", questionID).Delete(&models.QuizAnswer{}).Error; err != nil {
		return err
	}
	for i, a := range answers {
		if a.Content == "" {
			continue
		}
		ans := models.QuizAnswer{
			QuestionID: questionID,
			Content:    a.Content,
			IsCorrect:  a.IsCorrect,
			SortOrder:  i,
		}
		if err := db.Create(&ans).Error; err != nil {
			return err
		}
		for _, obj := range answerAssets[i] {
			if err := db.Create(&models.QuizAnswerAsset{AnswerID: ans.ID, ObjectName: obj}).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// ListAssets mengembalikan object name gambar aset soal/pembahasan dan semua
// jawaban milik soal — dipakai untuk diff saat edit.
func (r *Repository) ListAssets(questionID uint) (questionAssets, answerAssets []string, err error) {
	if err = r.db.Model(&models.QuizQuestionAsset{}).Where("question_id = ?", questionID).Pluck("object_name", &questionAssets).Error; err != nil {
		return nil, nil, err
	}
	if err = r.db.Model(&models.QuizAnswerAsset{}).
		Where("answer_id IN (SELECT id FROM quiz_answers WHERE question_id = ?)", questionID).
		Pluck("object_name", &answerAssets).Error; err != nil {
		return nil, nil, err
	}
	return questionAssets, answerAssets, nil
}

// DeleteWithAssets menghapus hard soal + jawaban + aset dari DB dan
// mengembalikan object name semua gambarnya untuk dibersihkan di storage.
func (r *Repository) DeleteWithAssets(questionID uint) ([]string, error) {
	var q models.QuizQuestion
	if err := r.db.Unscoped().First(&q, questionID).Error; err != nil {
		return nil, err
	}
	var names []string
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var qNames []string
		if err := tx.Model(&models.QuizQuestionAsset{}).Where("question_id = ?", questionID).Pluck("object_name", &qNames).Error; err != nil {
			return err
		}
		var aNames []string
		if err := tx.Model(&models.QuizAnswerAsset{}).
			Where("answer_id IN (SELECT id FROM quiz_answers WHERE question_id = ?)", questionID).
			Pluck("object_name", &aNames).Error; err != nil {
			return err
		}
		names = append(qNames, aNames...)
		if err := tx.Unscoped().Where("answer_id IN (SELECT id FROM quiz_answers WHERE question_id = ?)", questionID).Delete(&models.QuizAnswerAsset{}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("question_id = ?", questionID).Delete(&models.QuizQuestionAsset{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Select(clause.Associations).Delete(&q).Error
	})
	if err != nil {
		return nil, err
	}
	return names, nil
}
