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
	if err := r.db.Where("user_id = ?", userID).Preload("User").Preload("Claims").Order("created_at desc").Find(&invoices).Error; err != nil {
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

	if err := q.Preload("User").Preload("Claims").Order("created_at desc").Find(&invoices).Error; err != nil {
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

func (r *Repository) GetByPublicID(publicID string) (*models.Invoice, error) {
	var invoice models.Invoice
	if err := r.db.Preload("User").Preload("Claims").Where("public_id = ?", publicID).First(&invoice).Error; err != nil {
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

// ListClaimsByInvoice mengembalikan klaim refund satu invoice + sesi
// penyebabnya, urut lahir. Dipakai dialog refund admin.
func (r *Repository) ListClaimsByInvoice(invoiceID uint) ([]models.RefundClaim, error) {
	var claims []models.RefundClaim
	if err := r.db.Preload("Session").Where("invoice_id = ?", invoiceID).Order("created_at").Find(&claims).Error; err != nil {
		return nil, err
	}
	return claims, nil
}

func (r *Repository) GetClaim(id uint) (*models.RefundClaim, error) {
	var claim models.RefundClaim
	if err := r.db.Preload("Session").First(&claim, id).Error; err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *Repository) UpdateClaimDone(id uint, done bool) error {
	return r.db.Model(&models.RefundClaim{}).Where("id = ?", id).Update("done", done).Error
}
