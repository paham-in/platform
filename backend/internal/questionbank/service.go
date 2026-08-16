package questionbank

import (
	"context"
	"errors"
	"log"

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

// Access mewakili hak akses pemanggil terhadap paket soal.
type Access struct {
	CallerID uint
	IsAdmin  bool
	IsStaff  bool
}

var (
	// ErrNotFound dipakai juga utk akses baca yang ditolak (hindari bocorkan keberadaan).
	ErrNotFound = errors.New("paket soal tidak ditemukan")
	// ErrNotOwner utk tulis paket milik guru lain.
	ErrNotOwner = errors.New("bukan paket soal kamu")
)

// canViewPackage: published boleh dilihat semua; draft hanya admin, penulisnya,
// atau paket tanpa pemilik (author_id=0 — data lama yang belum di-claim).
func (s *Service) canViewPackage(p *models.QuizPackage, a Access) bool {
	if a.IsAdmin || p.Status == "published" {
		return true
	}
	if !a.IsStaff {
		return false
	}
	return p.AuthorID == a.CallerID || p.AuthorID == 0
}

// canManagePackage: admin selalu; selain admin hanya penulisnya atau tanpa pemilik.
func (s *Service) canManagePackage(p *models.QuizPackage, a Access) bool {
	if a.IsAdmin {
		return true
	}
	return p.AuthorID == a.CallerID || p.AuthorID == 0
}

func (s *Service) ListByPackage(packageID uint, search string, a Access) ([]QuestionResponse, error) {
	pkg, err := s.repo.GetPackage(packageID)
	if err != nil {
		return nil, ErrNotFound
	}
	if !s.canViewPackage(pkg, a) {
		return nil, ErrNotFound
	}
	questions, err := s.repo.ListByPackage(packageID, search)
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

type QuizAnswerInput struct {
	Content   string `json:"content"`
	IsCorrect bool   `json:"is_correct"`
}

type CreateInput struct {
	UserID      uint                      `json:"user_id"`
	Question    string                    `json:"question"`
	Answers     []QuizAnswerInput `json:"answers"`
	Explanation string                    `json:"explanation"`
}

// commitContent memindahkan gambar temp ke lokasi permanen (kalau ada) lalu
// menormalkan semua referensi gambar di content ke bentuk object name.
func (s *Service) commitContent(content string) (string, error) {
	if s.storage != nil {
		var err error
		content, err = s.storage.CommitTempImages(context.Background(), content)
		if err != nil {
			return "", err
		}
	}
	return storage.SanitizeContentImages(content), nil
}

// deleteFiles menghapus file gambar dari storage (best-effort — file orphan
// lebih aman daripada DB yang tidak konsisten).
func (s *Service) deleteFiles(objects []string) {
	if s.storage == nil {
		return
	}
	for _, obj := range objects {
		if err := s.storage.Delete(context.Background(), obj); err != nil {
			log.Printf("[questionbank] gagal hapus aset %q: %v", obj, err)
		}
	}
}

func (s *Service) Create(packageID uint, input CreateInput, a Access) (*QuestionResponse, error) {
	pkg, err := s.repo.GetPackage(packageID)
	if err != nil {
		return nil, ErrNotFound
	}
	if !s.canManagePackage(pkg, a) {
		return nil, ErrNotOwner
	}
	if input.Question == "" {
		return nil, errors.New("pertanyaan wajib diisi")
	}
	if packageID == 0 {
		return nil, errors.New("paket soal wajib diisi")
	}
	if len(input.Answers) < 2 {
		return nil, errors.New("minimal 2 opsi jawaban")
	}

	committed, err := s.commitContent(input.Question)
	if err != nil {
		return nil, err
	}
	explanation, err := s.commitContent(input.Explanation)
	if err != nil {
		return nil, err
	}

	q := models.QuizQuestion{
		UserID:      input.UserID,
		PackageID:   packageID,
		Question:    committed,
		Explanation: explanation,
	}
	// Build answers dengan sort_order sesuai urutan input + aset gambar
	// per-jawaban (sejajar dengan q.Answers — jawaban kosong disaring).
	answerAssets := make([][]string, 0, len(input.Answers))
	for i, a := range input.Answers {
		if a.Content == "" {
			continue
		}
		content, err := s.commitContent(a.Content)
		if err != nil {
			return nil, err
		}
		q.Answers = append(q.Answers, models.QuizAnswer{
			Content:   content,
			IsCorrect: a.IsCorrect,
			SortOrder: i,
		})
		answerAssets = append(answerAssets, storage.ExtractContentImages(content))
	}
	if err := s.repo.CreateWithAssets(&q, storage.ExtractContentImages(committed), answerAssets); err != nil {
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
	Answers     *[]QuizAnswerInput `json:"answers"`
	Explanation *string                    `json:"explanation"`
}

func (s *Service) Update(id uint, input UpdateInput, a Access) (*QuestionResponse, error) {
	q, err := s.repo.Get(id)
	if err != nil {
		return nil, ErrNotFound
	}
	pkg, err := s.repo.GetPackage(q.PackageID)
	if err != nil {
		return nil, ErrNotFound
	}
	if !s.canManagePackage(pkg, a) {
		return nil, ErrNotOwner
	}
	updates := map[string]any{}
	replaceQuestionAssets := false
	var questionAssets []string
	if input.Question != nil {
		committed, err := s.commitContent(*input.Question)
		if err != nil {
			return nil, err
		}
		updates["question"] = committed
		questionAssets = append(questionAssets, storage.ExtractContentImages(committed)...)
		replaceQuestionAssets = true
	}
	if input.Explanation != nil {
		committed, err := s.commitContent(*input.Explanation)
		if err != nil {
			return nil, err
		}
		updates["explanation"] = committed
		questionAssets = append(questionAssets, storage.ExtractContentImages(committed)...)
		replaceQuestionAssets = true
	}

	// diff aset soal/pembahasan: hapus file yang sudah tidak direferensikan.
	if replaceQuestionAssets && s.storage != nil {
		oldQuestionAssets, _, err := s.repo.ListAssets(id)
		if err != nil {
			return nil, err
		}
		s.deleteFiles(difference(oldQuestionAssets, questionAssets))
	}

	if input.Answers != nil {
		// sanitize content jawaban sebelum disimpan, lalu update soal + replace
		// jawaban dan asetnya dalam satu transaksi.
		answers := make([]QuizAnswerInput, len(*input.Answers))
		answerAssets := make([][]string, len(*input.Answers))
		var newAnswerAssets []string
		for i, a := range *input.Answers {
			content, err := s.commitContent(a.Content)
			if err != nil {
				return nil, err
			}
			answers[i] = QuizAnswerInput{Content: content, IsCorrect: a.IsCorrect}
			answerAssets[i] = storage.ExtractContentImages(content)
			newAnswerAssets = append(newAnswerAssets, answerAssets[i]...)
		}
		// diff aset jawaban: hapus file jawaban lama yang tidak dipakai lagi.
		if s.storage != nil {
			_, oldAnswerAssets, err := s.repo.ListAssets(id)
			if err != nil {
				return nil, err
			}
			s.deleteFiles(difference(oldAnswerAssets, newAnswerAssets))
		}
		var qAssets []string
		if replaceQuestionAssets {
			qAssets = questionAssets
		}
		if err := s.repo.UpdateWithAssets(id, updates, answers, qAssets, answerAssets); err != nil {
			return nil, err
		}
		return s.Get(id)
	}

	if len(updates) > 0 {
		var qAssets []string
		if replaceQuestionAssets {
			qAssets = questionAssets
		}
		if err := s.repo.UpdateWithAssets(id, updates, nil, qAssets, nil); err != nil {
			return nil, err
		}
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint, a Access) error {
	q, err := s.repo.Get(id)
	if err != nil {
		return ErrNotFound
	}
	pkg, err := s.repo.GetPackage(q.PackageID)
	if err != nil {
		return ErrNotFound
	}
	if !s.canManagePackage(pkg, a) {
		return ErrNotOwner
	}
	// hapus soal + jawaban + aset dari DB, lalu bersihkan file gambarnya.
	assetNames, err := s.repo.DeleteWithAssets(id)
	if err != nil {
		return err
	}
	s.deleteFiles(assetNames)
	return nil
}

// difference mengembalikan elemen a yang tidak ada di b.
func difference(a, b []string) []string {
	inB := make(map[string]bool, len(b))
	for _, x := range b {
		inB[x] = true
	}
	var out []string
	for _, x := range a {
		if !inB[x] {
			out = append(out, x)
		}
	}
	return out
}

func (s *Service) toResponse(q models.QuizQuestion) QuestionResponse {
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

func (s *Service) toResponses(questions []models.QuizQuestion) []QuestionResponse {
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		result[i] = s.toResponse(q)
	}
	return result
}
