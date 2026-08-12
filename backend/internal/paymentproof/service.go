package paymentproof

import (
	"bytes"
	"context"
	"image/jpeg"
	"io"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"gorm.io/gorm"
)

type Service struct {
	repo    *Repository
	db      *gorm.DB
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, db *gorm.DB, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, db: db, storage: store}
}

// UploadResponse dikembalikan ke frontend setelah upload berhasil.
type UploadResponse struct {
	ID        uint      `json:"id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// Upload memvalidasi ownership + invoice status, resize gambar, upload ke storage.
// Mengikuti pola UploadQuestionImage: validasi SEBELUM upload, kalau DB gagal
// hapus file biar tidak jadi orphan.
func (s *Service) Upload(ctx context.Context, invoiceID, userID uint, file io.Reader, filename, contentType string, size int64) (*UploadResponse, error) {
	// validasi ownership + status invoice SEBELUM upload file ke storage
	var invoice models.Invoice
	if err := s.db.First(&invoice, invoiceID).Error; err != nil {
		return nil, err
	}
	if invoice.UserID != userID {
		return nil, gorm.ErrInvalidData // akan ditangkap handler → 403
	}
	if invoice.Status != "pending" {
		return nil, gorm.ErrInvalidData // proof cuma boleh upload saat invoice pending
	}

	// decode + resize (pola upload handler yang sudah ada)
	img, err := imaging.Decode(file)
	if err != nil {
		return nil, err
	}
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80}); err != nil {
		return nil, err
	}

	// private — butuh presigned URL utk akses (admin & student lihat via presigned)
	objectName := s.storage.GenerateObjectNamePrivateIn("payment_proofs", filename)
	if err := s.storage.UploadReader(ctx, objectName, contentType, bytes.NewReader(buf.Bytes()), int64(buf.Len())); err != nil {
		return nil, err
	}

	// simpan DB; kalau gagal, hapus file biar tidak orphan
	proof := models.PaymentProof{
		InvoiceID:  invoiceID,
		ObjectName: objectName,
		Status:     "pending",
	}
	if err := s.repo.Create(&proof); err != nil {
		_ = s.storage.Delete(ctx, objectName)
		return nil, err
	}

	return &UploadResponse{
		ID:        proof.ID,
		Status:    proof.Status,
		CreatedAt: proof.CreatedAt,
	}, nil
}

// GetByInvoice mengembalikan semua proof milik invoice (termasuk URL presigned
// untuk yang sudah approved, supaya admin/student bisa lihat).
func (s *Service) GetByInvoice(ctx context.Context, invoiceID uint, storageTTL time.Duration) ([]ProofDetail, error) {
	proofs, err := s.repo.GetByInvoice(invoiceID)
	if err != nil {
		return nil, err
	}
	result := make([]ProofDetail, len(proofs))
	for i, p := range proofs {
		url := ""
		if p.Status == "approved" && s.storage != nil {
			if presigned, err := s.storage.PresignedURL(ctx, p.ObjectName, storageTTL); err == nil {
				url = presigned
			}
		}
		result[i] = ProofDetail{
			ID:         p.ID,
			Status:     p.Status,
			ApprovedAt: p.ApprovedAt,
			URL:        url,
			CreatedAt:  p.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return result, nil
}

// ProofDetail adalah representasi proof yang dikirim ke frontend (termasuk URL
// presigned untuk yang sudah approved).
type ProofDetail struct {
	ID         uint       `json:"id"`
	Status     string     `json:"status"`
	ApprovedAt *time.Time `json:"approved_at,omitempty"`
	URL        string     `json:"url,omitempty"` // presigned, kosong untuk pending
	CreatedAt  string     `json:"created_at"`
}

// ApproveByID admin-approve proof tertentu.
func (s *Service) ApproveByID(id uint) error {
	return s.repo.Approve(id, time.Now())
}

// ApproveNewestPending dipanggil oleh invoice.ToggleStatus ketika invoice
// di-toggle ke paid — otomatis approve proof pending terbaru untuk invoice ini.
func (s *Service) ApproveNewestPending(invoiceID uint) error {
	proof, err := s.repo.GetNewestPendingByInvoice(invoiceID)
	if err != nil {
		// tidak ada proof pending → tidak error, invoice tetap bisa di-toggle paid
		// (mis. admin bayar langsung tanpa upload bukti)
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return err
	}
	return s.repo.Approve(proof.ID, time.Now())
}

// ListApprovedOlderThan untuk cron job — hanya yang sudah approved.
func (s *Service) ListApprovedOlderThan(cutoff time.Time) ([]models.PaymentProof, error) {
	return s.repo.ListApprovedOlderThan(cutoff)
}

// Delete permanen proof + file storage. Dipakai cron.
func (s *Service) Delete(ctx context.Context, id uint) error {
	proof, err := s.repo.Get(id)
	if err != nil {
		return err
	}
	if s.storage != nil {
		_ = s.storage.Delete(ctx, proof.ObjectName)
	}
	return s.repo.Delete(id)
}
