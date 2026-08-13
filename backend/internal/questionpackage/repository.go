package questionpackage

import (
	"errors"

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
	if err := r.db.Preload("Questions").Preload("Subject").Preload("Collection").Order("created_at desc").Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *Repository) Get(id uint) (*models.QuestionPackage, error) {
	var pkg models.QuestionPackage
	if err := r.db.Preload("Questions").Preload("Subject").Preload("Collection").First(&pkg, id).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

// ListVisible untuk akses murid/user. Paket tanpa koleksi tidak pernah dikembalikan
// (belum dipublish ke murid). classIDs non-nil membatasi koleksi premium ke kelas
// tertentu (nil = semua kelas, staff). Koleksi free selalu ikut.
func (r *Repository) ListVisible(classIDs []uint) ([]models.QuestionPackage, error) {
	var packages []models.QuestionPackage
	q := r.db.Preload("Questions").Preload("Subject").Preload("Collection").
		Where("collection_id IS NOT NULL")
	if classIDs != nil {
		q = q.Where("collection_id IN (SELECT id FROM question_package_collections WHERE is_free = ? OR class_id IN ?)", true, classIDs)
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
	// Hapus jawaban semua soal dalam paket, lalu soal, lalu paket (hard delete)
	// dalam satu transaksi — kalau satu langkah gagal, semua batal.
	return r.db.Transaction(func(tx *gorm.DB) error {
		var qids []uint
		if err := tx.Model(&models.QuestionbankQuestion{}).Where("package_id = ?", id).Pluck("id", &qids).Error; err != nil {
			return err
		}
		if len(qids) > 0 {
			if err := tx.Unscoped().Where("question_id IN ?", qids).Delete(&models.QuestionbankAnswer{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("package_id = ?", id).Delete(&models.QuestionbankQuestion{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.QuestionPackage{}, id).Error
	})
}

// GetProgress mengembalikan daftar progress student untuk 1 paket.
// completedOnly=true → cuma soal yang sudah dikerjakan (deleted_at IS NULL).
func (r *Repository) GetProgress(userID, packageID uint, completedOnly bool) ([]models.StudentQuestionProgress, error) {
	var progress []models.StudentQuestionProgress
	q := r.db.Where("user_id = ? AND package_id = ?", userID, packageID)
	if completedOnly {
		q = q.Where("deleted_at IS NULL")
	}
	if err := q.Order("created_at asc").Find(&progress).Error; err != nil {
		return nil, err
	}
	return progress, nil
}

// SaveProgress upsert jawaban student. Kalau record untuk (user, package, question)
// sudah ada → update IsCorrect + SelectedAnswerID + restore deleted_at. Kalau belum → create.
func (r *Repository) SaveProgress(userID, packageID, questionID uint, isCorrect bool, selectedAnswerID uint) error {
	var existing models.StudentQuestionProgress
	err := r.db.Unscoped().Where("user_id = ? AND package_id = ? AND question_id = ?", userID, packageID, questionID).First(&existing).Error
	if err == nil {
		// sudah ada → update + restore kalau soft-deleted
		return r.db.Model(&existing).Updates(map[string]any{
			"is_correct":         isCorrect,
			"selected_answer_id": selectedAnswerID,
			"deleted_at":         nil,
		}).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	// belum ada → create
	return r.db.Create(&models.StudentQuestionProgress{
		UserID:            userID,
		PackageID:         packageID,
		QuestionID:        questionID,
		IsCorrect:         isCorrect,
		SelectedAnswerID:  selectedAnswerID,
	}).Error
}

// GetCompletedQuestionIDs mengembalikan ID soal yang sudah dikerjakan (non-deleted).
func (r *Repository) GetCompletedQuestionIDs(userID, packageID uint) ([]uint, error) {
	var ids []uint
	if err := r.db.Model(&models.StudentQuestionProgress{}).
		Where("user_id = ? AND package_id = ? AND deleted_at IS NULL", userID, packageID).
		Pluck("question_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

// GetCompletedProgress mengembalikan record progress student yang sudah dikerjakan (non-deleted).
// Dipakai untuk rebuild jawaban + pembahasan saat student kembali ke soal yang sudah dikerjakan.
func (r *Repository) GetCompletedProgress(userID, packageID uint) ([]models.StudentQuestionProgress, error) {
	var progress []models.StudentQuestionProgress
	if err := r.db.Where("user_id = ? AND package_id = ? AND deleted_at IS NULL", userID, packageID).
		Find(&progress).Error; err != nil {
		return nil, err
	}
	return progress, nil
}

// GetQuestionWithAnswers mengambil 1 soal + jawabannya (untuk grading).
func (r *Repository) GetQuestionWithAnswers(questionID uint) (models.QuestionbankQuestion, error) {
	var q models.QuestionbankQuestion
	if err := r.db.Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).First(&q, questionID).Error; err != nil {
		return q, err
	}
	return q, nil
}

// ListByPackage mengembalikan semua soal dalam paket + jawabannya.
func (r *Repository) ListByPackage(packageID uint) ([]models.QuestionbankQuestion, error) {
	var questions []models.QuestionbankQuestion
	if err := r.db.Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Where("package_id = ?", packageID).Order("created_at asc").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

// ListCollections mengembalikan koleksi paket soal. classIDs non-nil membatasi ke koleksi
// free (semua kelas) + koleksi premium di kelas yang diakses student; nil = semua
// kelas (staff).
func (r *Repository) ListCollections(classIDs []uint) ([]models.QuestionPackageCollection, error) {
	var collections []models.QuestionPackageCollection
	q := r.db.Preload("Class").Preload("Packages.Subject")
	if classIDs != nil {
		q = q.Where("is_free = ? OR class_id IN ?", true, classIDs)
	}
	if err := q.Order("created_at desc").Find(&collections).Error; err != nil {
		return nil, err
	}
	return collections, nil
}

func (r *Repository) GetCollection(id uint) (*models.QuestionPackageCollection, error) {
	var collection models.QuestionPackageCollection
	if err := r.db.Preload("Class").Preload("Packages.Subject").First(&collection, id).Error; err != nil {
		return nil, err
	}
	return &collection, nil
}

func (r *Repository) CreateCollection(collection *models.QuestionPackageCollection) error {
	return r.db.Create(collection).Error
}

func (r *Repository) UpdateCollection(collection *models.QuestionPackageCollection) error {
	return r.db.Save(collection).Error
}

// DeleteCollection menghapus koleksi (hard delete). Paket di dalamnya tidak ikut terhapus
// — collection_id di-null-kan dulu supaya FK tidak melanggar.
func (r *Repository) DeleteCollection(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.QuestionPackage{}).Where("collection_id = ?", id).Update("collection_id", nil).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.QuestionPackageCollection{}, id).Error
	})
}
