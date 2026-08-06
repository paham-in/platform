package questionpackage

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

func (r *Repository) List() ([]models.QuestionPackage, error) {
	var packages []models.QuestionPackage
	if err := r.db.Preload("Questions").Order("created_at desc").Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *Repository) Get(id uint) (*models.QuestionPackage, error) {
	var pkg models.QuestionPackage
	if err := r.db.Preload("Questions").First(&pkg, id).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

// ListVisible untuk akses murid/user. includePremium=false membatasi ke paket free.
func (r *Repository) ListVisible(includePremium bool) ([]models.QuestionPackage, error) {
	var packages []models.QuestionPackage
	q := r.db.Preload("Questions")
	if !includePremium {
		q = q.Where("is_free = ?", true)
	}
	if err := q.Order("created_at desc").Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *Repository) Create(pkg *models.QuestionPackage) error {
	return r.db.Create(pkg).Error
}

func (r *Repository) Update(pkg *models.QuestionPackage) error {
	return r.db.Save(pkg).Error
}

func (r *Repository) Delete(id uint) error {
	// Hapus jawaban semua soal dalam paket, lalu soal, lalu paket (hard delete).
	var qids []uint
	r.db.Model(&models.QuestionbankQuestion{}).Where("package_id = ?", id).Pluck("id", &qids)
	if len(qids) > 0 {
		if err := r.db.Unscoped().Where("question_id IN ?", qids).Delete(&models.QuestionbankAnswer{}).Error; err != nil {
			return err
		}
	}
	if err := r.db.Unscoped().Where("package_id = ?", id).Delete(&models.QuestionbankQuestion{}).Error; err != nil {
		return err
	}
	return r.db.Unscoped().Delete(&models.QuestionPackage{}, id).Error
}
