package questionbank

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

func (r *Repository) ListByChapter(chapterID uint) ([]models.QuestionBank, error) {
	var questions []models.QuestionBank
	if err := r.db.Where("chapter_id = ?", chapterID).Preload("User").Order("created_at desc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) List() ([]models.QuestionBank, error) {
	return r.ListFiltered(0)
}

// ListFiltered mengembalikan daftar soal. Jika createdBy > 0, filter hanya
// soal yang dibuat user tersebut. Semua guru tetap bisa melihat semua soal
// (bank bersama) jika createdBy == 0.
func (r *Repository) ListFiltered(createdBy uint) ([]models.QuestionBank, error) {
	var questions []models.QuestionBank
	q := r.db.Preload("User").Order("created_at desc")
	if createdBy > 0 {
		q = q.Where("user_id = ?", createdBy)
	}
	if err := q.Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Get(id uint) (*models.QuestionBank, error) {
	var q models.QuestionBank
	if err := r.db.First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) Count(chapterID uint) (int64, error) {
	q := r.db.Model(&models.QuestionBank{})
	if chapterID > 0 {
		q = q.Where("chapter_id = ?", chapterID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *Repository) ListPaginated(chapterID uint, page, perPage int) ([]models.QuestionBank, error) {
	if perPage <= 0 {
		perPage = 10
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * perPage
	q := r.db.Order("created_at desc")
	if chapterID > 0 {
		q = q.Where("chapter_id = ?", chapterID)
	}
	var questions []models.QuestionBank
	if err := q.Limit(perPage).Offset(offset).Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *Repository) Create(q *models.QuestionBank) error {
	return r.db.Create(q).Error
}

func (r *Repository) Update(id uint, updates map[string]any) error {
	return r.db.Model(&models.QuestionBank{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.QuestionBank{}, id).Error
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
