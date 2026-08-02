package questionbank

import (
	"errors"

	"bimbel2/backend/internal/models"
)

type QuestionResponse struct {
	ID           uint     `json:"id"`
	ChapterID    uint     `json:"chapter_id"`
	ChapterTitle string   `json:"chapter_title"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation"`
	CreatedAt    string   `json:"created_at"`
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListByChapter(chapterID uint) ([]QuestionResponse, error) {
	questions, err := s.repo.ListByChapter(chapterID)
	if err != nil {
		return nil, err
	}
	return s.toResponses(questions), nil
}

func (s *Service) List() ([]QuestionResponse, error) {
	questions, err := s.repo.List()
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

type CreateInput struct {
	ChapterID    uint     `json:"chapter_id"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation"`
}

func (s *Service) Create(input CreateInput) (*QuestionResponse, error) {
	if input.Question == "" {
		return nil, errors.New("pertanyaan wajib diisi")
	}
	if input.ChapterID == 0 {
		return nil, errors.New("chapter wajib diisi")
	}
	if len(input.Options) < 2 {
		return nil, errors.New("minimal 2 opsi jawaban")
	}
	if input.CorrectIndex < 0 || input.CorrectIndex >= len(input.Options) {
		return nil, errors.New("correct_index tidak valid")
	}

	q := models.QuestionBank{
		ChapterID:    input.ChapterID,
		Question:     input.Question,
		Options:      input.Options,
		CorrectIndex: input.CorrectIndex,
		Explanation:  input.Explanation,
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
	ChapterID    *uint     `json:"chapter_id"`
	Question     *string   `json:"question"`
	Options      *[]string `json:"options"`
	CorrectIndex *int      `json:"correct_index"`
	Explanation  *string   `json:"explanation"`
}

func (s *Service) Update(id uint, input UpdateInput) (*QuestionResponse, error) {
	updates := map[string]any{}
	if input.ChapterID != nil {
		updates["chapter_id"] = *input.ChapterID
	}
	if input.Question != nil {
		updates["question"] = *input.Question
	}
	if input.Options != nil {
		updates["options"] = *input.Options
	}
	if input.CorrectIndex != nil {
		updates["correct_index"] = *input.CorrectIndex
	}
	if input.Explanation != nil {
		updates["explanation"] = *input.Explanation
	}
	if len(updates) > 0 {
		if err := s.repo.Update(id, updates); err != nil {
			return nil, err
		}
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type PaginatedResponse struct {
	Data []QuestionResponse `json:"data"`
	Meta PaginationMeta     `json:"meta"`
}

func (s *Service) ListPaginated(chapterID uint, page, perPage int) (*PaginatedResponse, error) {
	total, err := s.repo.Count(chapterID)
	if err != nil {
		return nil, err
	}
	if perPage <= 0 {
		perPage = 10
	}
	if page <= 0 {
		page = 1
	}
	questions, err := s.repo.ListPaginated(chapterID, page, perPage)
	if err != nil {
		return nil, err
	}
	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}
	return &PaginatedResponse{
		Data: s.toResponses(questions),
		Meta: PaginationMeta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *Service) toResponse(q models.QuestionBank) QuestionResponse {
	title := ""
	if q.Chapter.ID != 0 {
		title = q.Chapter.Title
	}
	return QuestionResponse{
		ID:           q.ID,
		ChapterID:    q.ChapterID,
		ChapterTitle: title,
		Question:     q.Question,
		Options:      q.Options,
		CorrectIndex: q.CorrectIndex,
		Explanation:  q.Explanation,
		CreatedAt:    q.CreatedAt.Format("2006-01-02 15:04"),
	}
}

func (s *Service) toResponses(questions []models.QuestionBank) []QuestionResponse {
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		result[i] = s.toResponse(q)
	}
	return result
}
