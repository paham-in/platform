package questionbank

import (
	"errors"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

type AnswerResponse struct {
	ID        uint   `json:"id"`
	Content   string `json:"content"`
	IsCorrect bool   `json:"is_correct"`
}

type QuestionResponse struct {
	ID          uint             `json:"id"`
	UserID      uint             `json:"user_id"`
	UserName    string           `json:"user_name"`
	PackageID   uint             `json:"package_id"`
	Question    string           `json:"question"`
	Answers     []AnswerResponse `json:"answers"`
	Explanation string           `json:"explanation"`
	CreatedAt   string           `json:"created_at"`
}

type Service struct {
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, storage: store}
}

func (s *Service) ListByPackage(packageID uint) ([]QuestionResponse, error) {
	questions, err := s.repo.ListByPackage(packageID)
	if err != nil {
		return nil, err
	}
	return s.toResponses(questions), nil
}

func (s *Service) Get(id uint) (*QuestionResponse, error) {
	q, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*q)
	return &r, nil
}

type QuestionbankAnswerInput struct {
	Content   string `json:"content"`
	IsCorrect bool   `json:"is_correct"`
}

type CreateInput struct {
	UserID      uint                      `json:"user_id"`
	Question    string                    `json:"question"`
	Answers     []QuestionbankAnswerInput `json:"answers"`
	Explanation string                    `json:"explanation"`
}

func (s *Service) Create(packageID uint, input CreateInput) (*QuestionResponse, error) {
	if input.Question == "" {
		return nil, errors.New("pertanyaan wajib diisi")
	}
	if packageID == 0 {
		return nil, errors.New("paket soal wajib diisi")
	}
	if len(input.Answers) < 2 {
		return nil, errors.New("minimal 2 opsi jawaban")
	}

	q := models.QuestionbankQuestion{
		UserID:      input.UserID,
		PackageID:   packageID,
		Question:    storage.SanitizeContentImages(input.Question),
		Explanation: storage.SanitizeContentImages(input.Explanation),
	}
	// Build answers dengan sort_order sesuai urutan input.
	for i, a := range input.Answers {
		if a.Content == "" {
			continue
		}
		q.Answers = append(q.Answers, models.QuestionbankAnswer{
			Content:   storage.SanitizeContentImages(a.Content),
			IsCorrect: a.IsCorrect,
			SortOrder: i,
		})
	}
	if err := s.repo.Create(&q); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(q.ID)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Question    *string                    `json:"question"`
	Answers     *[]QuestionbankAnswerInput `json:"answers"`
	Explanation *string                    `json:"explanation"`
}

func (s *Service) Update(id uint, input UpdateInput) (*QuestionResponse, error) {
	updates := map[string]any{}
	if input.Question != nil {
		updates["question"] = storage.SanitizeContentImages(*input.Question)
	}
	if input.Explanation != nil {
		updates["explanation"] = storage.SanitizeContentImages(*input.Explanation)
	}
	if input.Answers != nil {
		// sanitize content jawaban sebelum disimpan, lalu update soal + replace
		// jawaban dalam satu transaksi.
		answers := make([]QuestionbankAnswerInput, len(*input.Answers))
		for i, a := range *input.Answers {
			answers[i] = QuestionbankAnswerInput{
				Content:   storage.SanitizeContentImages(a.Content),
				IsCorrect: a.IsCorrect,
			}
		}
		if err := s.repo.UpdateWithAnswers(id, updates, answers); err != nil {
			return nil, err
		}
	} else if len(updates) > 0 {
		if err := s.repo.Update(id, updates); err != nil {
			return nil, err
		}
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) toResponse(q models.QuestionbankQuestion) QuestionResponse {
	userName := ""
	if q.User.ID != 0 {
		userName = q.User.Name
	}
	answers := make([]AnswerResponse, len(q.Answers))
	for i, a := range q.Answers {
		answers[i] = AnswerResponse{
			ID:        a.ID,
			Content:   s.storage.RewriteContentImages(a.Content),
			IsCorrect: a.IsCorrect,
		}
	}
	return QuestionResponse{
		ID:          q.ID,
		UserID:      q.UserID,
		UserName:    userName,
		PackageID:   q.PackageID,
		Question:    s.storage.RewriteContentImages(q.Question),
		Answers:     answers,
		Explanation: s.storage.RewriteContentImages(q.Explanation),
		CreatedAt:   q.CreatedAt.Format("2006-01-02 15:04"),
	}
}

func (s *Service) toResponses(questions []models.QuestionbankQuestion) []QuestionResponse {
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		result[i] = s.toResponse(q)
	}
	return result
}
