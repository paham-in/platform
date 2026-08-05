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

func (r *Repository) ListByChapter(chapterID uint) ([]models.QuestionbankQuestion, error) {
	var questions []models.QuestionbankQuestion
	if err := r.db.Where("chapter_id = ?", chapterID).Preload("User").Preload("Chapter").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) List() ([]models.QuestionbankQuestion, error) {
	return r.ListFiltered(0)
}

// ListFiltered mengembalikan daftar soal. Jika createdBy > 0, filter hanya
// soal yang dibuat user tersebut. Semua guru tetap bisa melihat semua soal
// (bank bersama) jika createdBy == 0.
func (r *Repository) ListFiltered(createdBy uint) ([]models.QuestionbankQuestion, error) {
	var questions []models.QuestionbankQuestion
	q := r.db.Preload("User").Preload("Chapter").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Order("created_at desc")
	if createdBy > 0 {
		q = q.Where("user_id = ?", createdBy)
	}
	if err := q.Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Get(id uint) (*models.QuestionbankQuestion, error) {
	var q models.QuestionbankQuestion
	if err := r.db.Preload("User").Preload("Chapter").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) Count(chapterID uint) (int64, error) {
	q := r.db.Model(&models.QuestionbankQuestion{})
	if chapterID > 0 {
		q = q.Where("chapter_id = ?", chapterID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *Repository) ListPaginated(chapterID uint, page, perPage int) ([]models.QuestionbankQuestion, error) {
	if perPage <= 0 {
		perPage = 10
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * perPage
	q := r.db.Preload("User").Preload("Chapter").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Order("created_at desc")
	if chapterID > 0 {
		q = q.Where("chapter_id = ?", chapterID)
	}
	var questions []models.QuestionbankQuestion
	if err := q.Limit(perPage).Offset(offset).Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Create(q *models.QuestionbankQuestion) error {
	return r.db.Create(q).Error
}

// ReplaceAnswers menghapus semua jawaban lama soal ini lalu insert yang baru.
func (r *Repository) ReplaceAnswers(questionID uint, answers []QuestionbankAnswerInput) error {
	if err := r.db.Where("question_id = ?", questionID).Delete(&models.QuestionbankAnswer{}).Error; err != nil {
		return err
	}
	for i, a := range answers {
		if a.Content == "" {
			continue
		}
		ans := models.QuestionbankAnswer{
			QuestionID: questionID,
			Content:    a.Content,
			IsCorrect:  a.IsCorrect,
			SortOrder:  i,
		}
		if err := r.db.Create(&ans).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.QuestionbankQuestion{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	// Hard delete soal + bersihkan relasi has-many (questionbank_answers).
	// Select(clause.Associations) membuat GORM menghapus answers yang
	// merujuk ke soal ini sebelum menghapus soal.
	var q models.QuestionbankQuestion
	if err := r.db.Unscoped().First(&q, id).Error; err != nil {
		return err
	}
	return r.db.Unscoped().Select(clause.Associations).Delete(&q).Error
}

// PackageUsage menyimpan nama paket soal yang memakai suatu pertanyaan.
type PackageUsage struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

// ListPackageUsages mengembalikan daftar paket soal yang memakai pertanyaan ini
// (via tabel many2many package_questions).
func (r *Repository) ListPackageUsages(questionID uint) ([]PackageUsage, error) {
	var usages []PackageUsage
	err := r.db.Table("package_questions").
		Select("question_packages.id as id, question_packages.name as name").
		Joins("JOIN question_packages ON question_packages.id = package_questions.question_package_id").
		Where("package_questions.question_bank_id = ?", questionID).
		Order("question_packages.name").
		Scan(&usages).Error
	return usages, err
}
