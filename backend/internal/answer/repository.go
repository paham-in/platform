package answer

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

func (r *Repository) ListByQuestion(questionID uint) ([]models.ForumAnswer, error) {
	var answers []models.ForumAnswer
	if err := r.db.Preload("User").Where("question_id = ?", questionID).Order("created_at asc").Find(&answers).Error; err != nil {
		return nil, err
	}
	return answers, nil
}

// CreateWithDB menyimpan jawaban memakai koneksi tertentu (bisa tx).
func (r *Repository) CreateWithDB(db *gorm.DB, a *models.ForumAnswer) error {
	return db.Create(a).Error
}

func (r *Repository) ReloadWithUser(a *models.ForumAnswer) error {
	return r.db.Preload("User").First(a, a.ID).Error
}

func (r *Repository) GetByID(id uint) (*models.ForumAnswer, error) {
	var a models.ForumAnswer
	if err := r.db.First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.ForumAnswer{}, id).Error
}

// ListImages mengembalikan gambar pendukung semua jawaban pada satu pertanyaan.
func (r *Repository) ListImages(questionID uint) ([]models.ForumAnswerImage, error) {
	var images []models.ForumAnswerImage
	if err := r.db.
		Where("answer_id IN (?)", r.db.Model(&models.ForumAnswer{}).Select("id").Where("question_id = ?", questionID)).
		Find(&images).Error; err != nil {
		return nil, err
	}
	return images, nil
}

// ListImagesByAnswer mengembalikan gambar pendukung sebuah jawaban.
func (r *Repository) ListImagesByAnswer(answerID uint) ([]models.ForumAnswerImage, error) {
	var images []models.ForumAnswerImage
	if err := r.db.Where("answer_id = ?", answerID).Find(&images).Error; err != nil {
		return nil, err
	}
	return images, nil
}

// DeleteImageRows menghapus semua record gambar pendukung sebuah jawaban.
func (r *Repository) DeleteImageRows(answerID uint) error {
	return r.db.Where("answer_id = ?", answerID).Delete(&models.ForumAnswerImage{}).Error
}
