package setting

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

// Get mengambil nilai setting berdasarkan key. GORM ErrRecordNotFound kalau belum ada.
func (r *Repository) Get(key string) (string, error) {
	var s models.Setting
	if err := r.db.Where("key = ?", key).First(&s).Error; err != nil {
		return "", err
	}
	return s.Value, nil
}

func (r *Repository) GetAll() (map[string]string, error) {
	var rows []models.Setting
	if err := r.db.Find(&rows).Error; err != nil {
		return nil, err
	}
	m := make(map[string]string, len(rows))
	for _, s := range rows {
		m[s.Key] = s.Value
	}
	return m, nil
}

// Set upsert: key sudah ada → update value, belum ada → insert.
func (r *Repository) Set(key, value string) error {
	var s models.Setting
	if err := r.db.Where("key = ?", key).First(&s).Error; err == nil {
		return r.db.Model(&s).Update("value", value).Error
	}
	return r.db.Create(&models.Setting{Key: key, Value: value}).Error
}

// DeleteStale menghapus setting dengan key yang tidak lagi dikenal.
func (r *Repository) DeleteStale(known map[string]bool) error {
	keys := make([]string, 0, len(known))
	for k := range known {
		keys = append(keys, k)
	}
	return r.db.Where("key NOT IN ?", keys).Delete(&models.Setting{}).Error
}
