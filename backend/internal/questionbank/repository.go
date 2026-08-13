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

func (r *Repository) ListByPackage(packageID uint) ([]models.QuizQuestion, error) {
	var questions []models.QuizQuestion
	if err := r.db.Preload("User").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Where("package_id = ?", packageID).Order("created_at desc").Find(&questions).Error; err != nil {
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

func (r *Repository) Create(q *models.QuizQuestion) error {
	// GORM default membungkus create has-many (soal + jawaban) dalam transaksi.
	return r.db.Create(q).Error
}

// UpdateWithAnswers mengubah field soal + mengganti jawaban dalam satu
// transaksi — kalau replace jawaban gagal, perubahan soal ikut batal.
func (r *Repository) UpdateWithAnswers(questionID uint, updates map[string]any, answers []QuizAnswerInput) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(&models.QuizQuestion{}).Where("id = ?", questionID).Updates(updates).Error; err != nil {
				return err
			}
		}
		return r.replaceAnswersTx(tx, questionID, answers)
	})
}

func (r *Repository) replaceAnswersTx(db *gorm.DB, questionID uint, answers []QuizAnswerInput) error {
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
	}
	return nil
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.QuizQuestion{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	// Hard delete soal + bersihkan relasi has-many (quiz_answers).
	var q models.QuizQuestion
	if err := r.db.Unscoped().First(&q, id).Error; err != nil {
		return err
	}
	return r.db.Unscoped().Select(clause.Associations).Delete(&q).Error
}
