package invoice

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

func (r *Repository) ListByUser(userID uint) ([]models.Invoice, error) {
	var invoices []models.Invoice
	if err := r.db.Where("user_id = ?", userID).Preload("User").Order("created_at desc").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *Repository) ListByUserFiltered(userID uint, status, search string) ([]models.Invoice, error) {
	var invoices []models.Invoice
	q := r.db.Where("user_id = ?", userID)

	if status != "" && status != "all" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("note ILIKE ? OR start_date ILIKE ? OR end_date ILIKE ?", like, like, like)
	}

	if err := q.Preload("User").Order("created_at desc").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *Repository) Get(id uint) (*models.Invoice, error) {
	var invoice models.Invoice
	if err := r.db.Preload("User").First(&invoice, id).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

func (r *Repository) Create(invoice *models.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.Invoice{}, id).Error
}
