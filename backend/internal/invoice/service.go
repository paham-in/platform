package invoice

import (
	"errors"
	"fmt"
	"regexp"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/notification"

	"gorm.io/gorm"
)

type InvoiceResponse struct {
	ID        uint    `json:"id"`
	UserID    uint    `json:"user_id"`
	UserName  string  `json:"user_name"`
	Amount    float64 `json:"amount"`
	StartDate string  `json:"start_date"`
	EndDate   string  `json:"end_date"`
	Status    string  `json:"status"`
	Note      string  `json:"note"`
	CreatedAt string  `json:"created_at"`
	BookingID *uint   `json:"booking_id,omitempty"`
}

type Service struct {
	repo    *Repository
	db      *gorm.DB
	notifSvc *notification.Service
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
}

func (s *Service) SetNotificationService(n *notification.Service) {
	s.notifSvc = n
}

var dateRegex = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func (s *Service) ListByUser(userID uint) ([]InvoiceResponse, error) {
	invoices, err := s.repo.ListByUser(userID)
	if err != nil {
		return nil, err
	}
	return toResponses(invoices), nil
}

func (s *Service) ListByUserFiltered(userID uint, status, search string) ([]InvoiceResponse, error) {
	invoices, err := s.repo.ListByUserFiltered(userID, status, search)
	if err != nil {
		return nil, err
	}
	return toResponses(invoices), nil
}

type CreateInput struct {
	UserID    uint    `json:"user_id"`
	Amount    float64 `json:"amount"`
	StartDate string  `json:"start_date"`
	EndDate   string  `json:"end_date"`
	Note      string  `json:"note"`
	ClassID   *uint   `json:"class_id,omitempty"`
}

func (s *Service) Create(input CreateInput) (*InvoiceResponse, error) {
	if input.Amount <= 0 {
		return nil, errors.New("amount harus lebih dari 0")
	}
	if !dateRegex.MatchString(input.StartDate) || !dateRegex.MatchString(input.EndDate) {
		return nil, errors.New("format tanggal harus YYYY-MM-DD")
	}
	if input.StartDate > input.EndDate {
		return nil, errors.New("start_date tidak boleh setelah end_date")
	}

	invoice := models.Invoice{
		UserID:    input.UserID,
		Amount:    input.Amount,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		Status:    "pending",
		Note:      input.Note,
		ClassID:   input.ClassID,
	}
	if err := s.repo.Create(&invoice); err != nil {
		return nil, err
	}

	// reload with User preloaded
	created, err := s.repo.Get(invoice.ID)
	if err != nil {
		return nil, err
	}

	if s.notifSvc != nil {
		s.notifSvc.Notify(input.UserID, "Invoice baru", fmt.Sprintf("Tagihan sebesar Rp%.0f telah dibuat", input.Amount), "invoice", "/dashboard/invoices")
	}

	r := toResponse(*created)
	return &r, nil
}

func (s *Service) ToggleStatus(id uint) (*InvoiceResponse, error) {
	invoice, err := s.repo.Get(id)
	if err != nil {
		return nil, errors.New("invoice tidak ditemukan")
	}

	newStatus := "paid"
	if invoice.Status == "paid" {
		newStatus = "pending"
	}

	// Update status invoice + grant/revoke StudentClass dalam satu transaksi
	// kalau salah satu gagal, semua batal (invoice & akses kelas tetap konsisten).
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Invoice{}).Where("id = ?", id).Update("status", newStatus).Error; err != nil {
			return err
		}
		if invoice.ClassID == nil {
			return nil
		}

		// Perpanjangan: kalau akses lama masih aktif saat invoice mulai
		// (expiry >= start_date), expiry baru = expiry lama + durasi invoice.
		// Kalau akses sudah habis, mulai dari end_date invoice seperti biasa.
		var existing models.StudentClassEnrollment
		if err := tx.Where("user_id = ? AND class_id = ? AND expiry >= ?",
			invoice.UserID, *invoice.ClassID, invoice.StartDate).
			Order("expiry desc").First(&existing).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		}

		// hapus akses lama utk kombinasi (user, class), lalu buat ulang dgn expiry baru
		if err := tx.Where("user_id = ? AND class_id = ?", invoice.UserID, *invoice.ClassID).
			Delete(&models.StudentClassEnrollment{}).Error; err != nil {
			return err
		}
		if newStatus == "paid" {
			expiry := invoice.EndDate
			if existing.ID != 0 {
				durationDays, err := daysBetween(invoice.StartDate, invoice.EndDate)
				if err != nil {
					return err
				}
				expiry, err = addDays(existing.Expiry, durationDays)
				if err != nil {
					return err
				}
			}
			return tx.Create(&models.StudentClassEnrollment{
				UserID:  invoice.UserID,
				ClassID: *invoice.ClassID,
				Expiry:  expiry,
			}).Error
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}

	if newStatus == "paid" && s.notifSvc != nil {
		s.notifSvc.Notify(invoice.UserID, "Pembayaran dikonfirmasi", fmt.Sprintf("Invoice sebesar Rp%.0f telah lunas", invoice.Amount), "invoice", "/dashboard/invoices")
	}

	r := toResponse(*updated)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	invoice, err := s.repo.Get(id)
	if err != nil {
		return errors.New("invoice tidak ditemukan")
	}
	if invoice.BookingID != nil {
		return errors.New("invoice dari booking tidak bisa dihapus")
	}
	if invoice.Status == "paid" {
		return errors.New("invoice lunas tidak bisa dihapus")
	}
	return s.repo.Delete(id)
}

// StudentDeleteInvoice membatalkan invoice langganan milik murid sendiri.
// Hanya yang masih pending dan bukan dari booking (invoice booking hanya bisa
// hilang lewat pembatalan booking). Pending = belum ada uang masuk.
func (s *Service) StudentDeleteInvoice(id, userID uint) error {
	invoice, err := s.repo.Get(id)
	if err != nil {
		return errors.New("invoice tidak ditemukan")
	}
	if invoice.UserID != userID {
		return errors.New("bukan invoice kamu")
	}
	if invoice.Status != "pending" {
		return errors.New("hanya invoice pending yang bisa dibatalkan")
	}
	if invoice.BookingID != nil {
		return errors.New("invoice booking hanya bisa hilang lewat pembatalan booking")
	}
	return s.repo.Delete(id)
}

// daysBetween mengembalikan jumlah hari antara dua tanggal YYYY-MM-DD
// (end - start), dipakai utk menghitung durasi invoice saat perpanjangan.
func daysBetween(start, end string) (int, error) {
	s, err := time.Parse("2006-01-02", start)
	if err != nil {
		return 0, err
	}
	e, err := time.Parse("2006-01-02", end)
	if err != nil {
		return 0, err
	}
	return int(e.Sub(s).Hours() / 24), nil
}

// addDays menambah N hari ke tanggal YYYY-MM-DD.
func addDays(date string, days int) (string, error) {
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return "", err
	}
	return t.AddDate(0, 0, days).Format("2006-01-02"), nil
}

func toResponse(i models.Invoice) InvoiceResponse {
	name := ""
	if i.User != nil {
		name = i.User.Name
	}
	return InvoiceResponse{
		ID:        i.ID,
		UserID:    i.UserID,
		UserName:  name,
		Amount:    i.Amount,
		StartDate: i.StartDate,
		EndDate:   i.EndDate,
		Status:    i.Status,
		Note:      i.Note,
		CreatedAt: i.CreatedAt.Format("2006-01-02"),
		BookingID: i.BookingID,
	}
}

func toResponses(invoices []models.Invoice) []InvoiceResponse {
	result := make([]InvoiceResponse, len(invoices))
	for i, v := range invoices {
		result[i] = toResponse(v)
	}
	return result
}
