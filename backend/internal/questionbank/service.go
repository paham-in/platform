package questionbank

import (
	"errors"
	"regexp"
	"strings"

	"bimbel2/backend/internal/models"
)

type QuestionResponse struct {
	ID           uint     `json:"id"`
	UserID       uint     `json:"user_id"`
	UserName     string   `json:"user_name"`
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

func (s *Service) ListFiltered(createdBy uint) ([]QuestionResponse, error) {
	questions, err := s.repo.ListFiltered(createdBy)
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
	UserID       uint     `json:"user_id"`
	ChapterID    uint     `json:"chapter_id"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation"`
}

var htmlTagRe = regexp.MustCompile(`<[^>]*>`)

// normalizeQuestionText membandingkan soal dengan mengabaikan tag HTML,
// whitespace berlebih, dan huruf besar/kecil — agar duplikasi terdeteksi
// walau format HTMLnya sedikit berbeda (mis. hasil import docx vs manual).
func normalizeQuestionText(s string) string {
	s = htmlTagRe.ReplaceAllString(s, " ")
	s = strings.Join(strings.Fields(s), " ")
	return strings.ToLower(s)
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

	// Cek duplikasi: soal dengan pertanyaan sama (normalized) di chapter yang sama.
	existing, err := s.repo.ListByChapter(input.ChapterID)
	if err != nil {
		return nil, err
	}
	norm := normalizeQuestionText(input.Question)
	for _, e := range existing {
		if normalizeQuestionText(e.Question) == norm {
			return nil, errors.New("soal dengan pertanyaan yang sama sudah ada di chapter ini")
		}
	}

	q := models.QuestionBank{
		UserID:       input.UserID,
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

// BulkDeleteResult berisi hasil hapus banyak soal sekaligus.
type BulkDeleteResult struct {
	Deleted []uint               `json:"deleted"`
	Failed  []BulkDeleteFailedItem `json:"failed"`
}

// BulkDeleteFailedItem berisi kegagalan hapus satu soal.
type BulkDeleteFailedItem struct {
	ID    uint   `json:"id"`
	Error string `json:"error"`
}

// BulkDelete menghapus banyak soal sekaligus (satu request).
// Soal yang dipakai di paket ditolak dan dicatat di `failed`.
func (s *Service) BulkDelete(ids []uint) BulkDeleteResult {
	result := BulkDeleteResult{}
	for _, id := range ids {
		// Cek apakah soal masih dipakai di paket soal — jika ya, tolak hard delete
		// agar tidak merusak referensi (foreign key) di tabel package_questions.
		usages, err := s.repo.ListPackageUsages(id)
		if err != nil {
			result.Failed = append(result.Failed, BulkDeleteFailedItem{ID: id, Error: err.Error()})
			continue
		}
		if len(usages) > 0 {
			names := make([]string, 0, len(usages))
			for _, u := range usages {
				names = append(names, u.Name)
			}
			result.Failed = append(result.Failed, BulkDeleteFailedItem{ID: id, Error: "soal digunakan di paket: " + strings.Join(names, ", ")})
			continue
		}
		if err := s.repo.Delete(id); err != nil {
			result.Failed = append(result.Failed, BulkDeleteFailedItem{ID: id, Error: err.Error()})
		} else {
			result.Deleted = append(result.Deleted, id)
		}
	}
	return result
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
	userName := ""
	if q.User.ID != 0 {
		userName = q.User.Name
	}
	return QuestionResponse{
		ID:           q.ID,
		UserID:       q.UserID,
		UserName:     userName,
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
