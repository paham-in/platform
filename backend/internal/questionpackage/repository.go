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
	if err := r.db.Preload("Questions").Preload("Subject").Preload("Group").Order("created_at desc").Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *Repository) Get(id uint) (*models.QuestionPackage, error) {
	var pkg models.QuestionPackage
	if err := r.db.Preload("Questions").Preload("Subject").Preload("Group").First(&pkg, id).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

// ListVisible untuk akses murid/user. Paket tanpa grup tidak pernah dikembalikan
// (belum dipublish ke murid). classIDs non-nil membatasi grup premium ke kelas
// tertentu (nil = semua kelas, staff). Grup free selalu ikut.
func (r *Repository) ListVisible(classIDs []uint) ([]models.QuestionPackage, error) {
	var packages []models.QuestionPackage
	q := r.db.Preload("Questions").Preload("Subject").Preload("Group").
		Where("group_id IS NOT NULL")
	if classIDs != nil {
		q = q.Where("group_id IN (SELECT id FROM question_package_groups WHERE is_free = ? OR class_id IN ?)", true, classIDs)
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

// ListGroups mengembalikan grup paket soal. classIDs non-nil membatasi ke grup
// free (semua kelas) + grup premium di kelas yang diakses student; nil = semua
// kelas (staff).
func (r *Repository) ListGroups(classIDs []uint) ([]models.QuestionPackageGroup, error) {
	var groups []models.QuestionPackageGroup
	q := r.db.Preload("Class").Preload("Packages.Subject")
	if classIDs != nil {
		q = q.Where("is_free = ? OR class_id IN ?", true, classIDs)
	}
	if err := q.Order("created_at desc").Find(&groups).Error; err != nil {
		return nil, err
	}
	return groups, nil
}

func (r *Repository) GetGroup(id uint) (*models.QuestionPackageGroup, error) {
	var group models.QuestionPackageGroup
	if err := r.db.Preload("Class").Preload("Packages.Subject").First(&group, id).Error; err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *Repository) CreateGroup(group *models.QuestionPackageGroup) error {
	return r.db.Create(group).Error
}

func (r *Repository) UpdateGroup(group *models.QuestionPackageGroup) error {
	return r.db.Save(group).Error
}

// DeleteGroup menghapus grup (hard delete). Paket di dalamnya tidak ikut terhapus
// — group_id di-null-kan dulu supaya FK tidak melanggar.
func (r *Repository) DeleteGroup(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.QuestionPackage{}).Where("group_id = ?", id).Update("group_id", nil).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.QuestionPackageGroup{}, id).Error
	})
}
