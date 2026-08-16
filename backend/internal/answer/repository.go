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

// CreateAssetsWithDB mencatat aset gambar content jawaban memakai koneksi tertentu.
func (r *Repository) CreateAssetsWithDB(db *gorm.DB, answerID uint, objectNames []string) error {
	if len(objectNames) == 0 {
		return nil
	}
	rows := make([]models.ForumAnswerAsset, len(objectNames))
	for i, obj := range objectNames {
		rows[i] = models.ForumAnswerAsset{AnswerID: answerID, ObjectName: obj}
	}
	return db.Create(&rows).Error
}

// ListAssetObjectNames mengembalikan object name aset content jawaban.
func (r *Repository) ListAssetObjectNames(answerID uint) ([]string, error) {
	var names []string
	if err := r.db.Model(&models.ForumAnswerAsset{}).
		Where("answer_id = ?", answerID).
		Pluck("object_name", &names).Error; err != nil {
		return nil, err
	}
	return names, nil
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

// DeleteWithAssets menghapus jawaban beserta aset content-nya dalam satu
// transaksi. Mengembalikan object name aset supaya caller bisa membersihkan
// object storage setelah commit.
func (r *Repository) DeleteWithAssets(answerID uint) ([]string, error) {
	var objectNames []string
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Model(&models.ForumAnswerAsset{}).
			Where("answer_id = ?", answerID).
			Pluck("object_name", &objectNames).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("answer_id = ?", answerID).Delete(&models.ForumAnswerAsset{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.ForumAnswer{}, answerID).Error
	})
	if err != nil {
		return nil, err
	}
	return objectNames, nil
}
