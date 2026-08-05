package questionpackage

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

func (r *Repository) Create(pkg *models.QuestionPackage) error {
	return r.db.Create(pkg).Error
}

func (r *Repository) Update(pkg *models.QuestionPackage) error {
	return r.db.Save(pkg).Error
}

func (r *Repository) SetQuestions(pkgID uint, questionIDs []uint) error {
	var pkg models.QuestionPackage
	if err := r.db.First(&pkg, pkgID).Error; err != nil {
		return err
	}
	var questions []models.QuestionBank
	if len(questionIDs) > 0 {
		if err := r.db.Where("id IN ?", questionIDs).Find(&questions).Error; err != nil {
			return err
		}
	}
	return r.db.Model(&pkg).Association("Questions").Replace(questions)
}

func (r *Repository) Delete(id uint) error {
	// Hard delete + bersihkan relasi many2many (package_questions).
	// Select(clause.Associations) membuat GORM menghapus baris join
	// yang merujuk ke paket ini, lalu menghapus paket secara permanen.
	var pkg models.QuestionPackage
	if err := r.db.Unscoped().First(&pkg, id).Error; err != nil {
		return err
	}
	return r.db.Unscoped().Select(clause.Associations).Delete(&pkg).Error
}
