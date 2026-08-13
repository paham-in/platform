package forum

import (
	"errors"
	"html"
	"regexp"
	"strings"

	"bimbel2/backend/internal/models"
)

var reHTMLTag = regexp.MustCompile(`<[^>]*>`)

func stripHTML(s string) string {
	s = reHTMLTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.TrimSpace(s)
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(subjectID, userID *uint, unanswered bool) ([]models.ForumQuestion, error) {
	return s.repo.List(subjectID, userID, unanswered)
}

func (s *Service) Create(userID uint, content string, subjectID *uint) (*models.ForumQuestion, error) {
	question := models.ForumQuestion{
		UserID:       userID,
		Content:      content,
		PlainContent: stripHTML(content),
		Status:       "open",
		SubjectID:    subjectID,
	}
	if err := s.repo.Create(&question); err != nil {
		return nil, err
	}
	return &question, nil
}

func (s *Service) Delete(id, userID uint) error {
	q, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	if q.UserID != userID {
		return errors.New("bukan pemilik pertanyaan")
	}
	return s.repo.Delete(id)
}

func (s *Service) AdminDelete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	return s.repo.Delete(id)
}

func (s *Service) GetByID(id uint) (*models.ForumQuestion, error) {
	return s.repo.GetByID(id)
}

func (s *Service) GetUser(userID uint) (*models.User, error) {
	return s.repo.GetUserByID(userID)
}
