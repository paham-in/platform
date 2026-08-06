package invoice

import (
	"errors"
	"regexp"

	"bimbel2/backend/internal/models"

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
}

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
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
	ProgramID *uint   `json:"program_id,omitempty"`
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
		ProgramID: input.ProgramID,
	}
	if err := s.repo.Create(&invoice); err != nil {
		return nil, err
	}

	// reload with User preloaded
	created, err := s.repo.Get(invoice.ID)
	if err != nil {
		return nil, err
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

	if err := s.repo.UpdateStatus(id, newStatus); err != nil {
		return nil, err
	}

	// akses premium dihitung query-realtime dari invoice paid + end_date aktif.
	// tidak perlu grant role/manual — semua pendaftar otomatis student.
	//
	// invoice lunas yang punya program_id → otomatis grant StudentProgram
	// (akses premium via program). Jika kembali ke pending → revoke StudentProgram.
	if invoice.ProgramID != nil {
		// hapus akses lama untuk kombinasi (user, program) supaya expiry selalu ikut end_date invoice
		s.db.Where("user_id = ? AND program_id = ?", invoice.UserID, *invoice.ProgramID).
			Delete(&models.StudentProgram{})
		if newStatus == "paid" {
			s.db.Create(&models.StudentProgram{
				UserID:    invoice.UserID,
				ProgramID: *invoice.ProgramID,
				Expiry:    invoice.EndDate,
			})
		}
	}

	updated, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := toResponse(*updated)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
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
	}
}

func toResponses(invoices []models.Invoice) []InvoiceResponse {
	result := make([]InvoiceResponse, len(invoices))
	for i, v := range invoices {
		result[i] = toResponse(v)
	}
	return result
}
