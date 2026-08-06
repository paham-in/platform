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

func (r *Repository) List(subjectID, userID *uint, unanswered bool) ([]models.Question, error) {
	var questions []models.Question
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
		q = q.Where("NOT EXISTS (SELECT 1 FROM answers WHERE answers.question_id = questions.id)")
	}
	if err := q.Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) GetByID(id uint) (*models.Question, error) {
	var q models.Question
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

func (r *Repository) Create(q *models.Question) error {
	return r.db.Create(q).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Question{}, id).Error
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetQuestionImages(questionID uint) ([]models.QuestionImage, error) {
	var images []models.QuestionImage
	if err := r.db.Where("question_id = ?", questionID).Find(&images).Error; err != nil {
		return nil, err
	}
	return images, nil
}

func (r *Repository) DeleteQuestionImage(fileName string) error {
	return r.db.Where("file_name = ?", fileName).Delete(&models.QuestionImage{}).Error
}
