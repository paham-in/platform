package answer

import (
	"errors"
	"html"
	"regexp"
	"strings"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

var reHTMLTag = regexp.MustCompile(`<[^>]*>`)

func stripHTML(s string) string {
	s = reHTMLTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.TrimSpace(s)
}

type Service struct {
	repo      *Repository
	questionRepo *QuestionRepository
}

func NewService(repo *Repository, questionRepo *QuestionRepository) *Service {
	return &Service{repo: repo, questionRepo: questionRepo}
}

func (s *Service) ListByQuestion(questionID uint) ([]models.Answer, error) {
	return s.repo.ListByQuestion(questionID)
}

func (s *Service) Delete(id, userID uint) error {
	a, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("jawaban tidak ditemukan")
	}
	if a.UserID != userID {
		return errors.New("bukan pemilik jawaban")
	}
	return s.repo.Delete(id)
}

func (s *Service) Create(questionID, userID uint, content string) (*models.Answer, error) {
	question, err := s.questionRepo.GetByID(questionID)
	if err != nil {
		return nil, errors.New("pertanyaan tidak ditemukan")
	}

	if question.UserID == userID {
		return nil, errors.New("tidak bisa menjawab pertanyaan sendiri")
	}

	answer := models.Answer{
		QuestionID:   questionID,
		UserID:       userID,
		Content:      content,
		PlainContent: stripHTML(content),
	}
	if err := s.repo.Create(&answer); err != nil {
		return nil, err
	}

	// Pertanyaan sudah dijawab → ubah status dari "open" menjadi "answered".
	if err := s.questionRepo.MarkAnswered(questionID); err != nil {
		return nil, err
	}

	// reload with User preloaded
	if err := s.repo.ReloadWithUser(&answer); err != nil {
		return nil, err
	}
	return &answer, nil
}

// Tiny repo interface for question lookup to avoid circular import
type QuestionRepository struct {
	db *gorm.DB
}

func NewQuestionRepository(db *gorm.DB) *QuestionRepository {
	return &QuestionRepository{db: db}
}

func (r *QuestionRepository) GetByID(id uint) (*models.Question, error) {
	var q models.Question
	if err := r.db.First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

// MarkAnswered mengubah status pertanyaan menjadi "answered" jika masih "open".
func (r *QuestionRepository) MarkAnswered(id uint) error {
	return r.db.Model(&models.Question{}).
		Where("id = ? AND status = ?", id, "open").
		Update("status", "answered").Error
}
