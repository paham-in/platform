package paymentproof

import (
	"time"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetByInvoice mengembalikan semua payment proof milik invoice, terbaru dulu.
func (r *Repository) GetByInvoice(invoiceID uint) ([]models.PaymentProof, error) {
	var proofs []models.PaymentProof
	if err := r.db.Where("invoice_id = ?", invoiceID).Order("created_at desc").Find(&proofs).Error; err != nil {
		return nil, err
	}
	return proofs, nil
}

// Get mengembalikan satu proof berdasarkan ID.
func (r *Repository) Get(id uint) (*models.PaymentProof, error) {
	var proof models.PaymentProof
	if err := r.db.First(&proof, id).Error; err != nil {
		return nil, err
	}
	return &proof, nil
}

// Create menyimpan record payment proof.
func (r *Repository) Create(proof *models.PaymentProof) error {
	return r.db.Create(proof).Error
}

// ListApprovedOlderThan mengembalikan proof yang sudah di-approve (approved_at < cutoff).
// Dipakai oleh cron job untuk cleanup.
func (r *Repository) ListApprovedOlderThan(cutoff time.Time) ([]models.PaymentProof, error) {
	var proofs []models.PaymentProof
	// approved_at < cutoff → proof yang sudah disetujui dan melewati masa simpan.
	// Preload tidak perlu — kita cuma butuh ObjectName.
	if err := r.db.Where("status = ? AND approved_at < ?", "approved", cutoff).
		Find(&proofs).Error; err != nil {
		return nil, err
	}
	return proofs, nil
}

// Delete permanen (hard delete) — dipakai cron setelah file storage berhasil dihapus.
func (r *Repository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.PaymentProof{}, id).Error
}

// GetNewestPendingByInvoice mengembalikan proof pending terbaru untuk invoice ini.
// Dipakai saat toggle paid — otomatis approve proof terbaru.
func (r *Repository) GetNewestPendingByInvoice(invoiceID uint) (*models.PaymentProof, error) {
	var proof models.PaymentProof
	if err := r.db.Where("invoice_id = ? AND status = ?", invoiceID, "pending").
		Order("created_at desc").First(&proof).Error; err != nil {
		return nil, err
	}
	return &proof, nil
}

// Approve menandai proof sebagai approved + set approved_at.
func (r *Repository) Approve(id uint, now time.Time) error {
	return r.db.Model(&models.PaymentProof{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     "approved",
			"approved_at": now,
		}).Error
}
