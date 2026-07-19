package forum

import (
	"context"
	"errors"
	"html"
	"regexp"
	"strings"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

var reHTMLTag = regexp.MustCompile(`<[^>]*>`)

func stripHTML(s string) string {
	s = reHTMLTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.TrimSpace(s)
}

type Service struct {
	repo  *Repository
	minio *storage.MinioClient
}

func NewService(repo *Repository, minio *storage.MinioClient) *Service {
	return &Service{repo: repo, minio: minio}
}

func (s *Service) List(subjectID, userID *uint) ([]models.Question, error) {
	return s.repo.List(subjectID, userID)
}

func (s *Service) Create(userID uint, content string, subjectID *uint) (*models.Question, error) {
	question := models.Question{
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

func (s *Service) cleanupImages(questionID uint) {
	if s.minio == nil {
		return
	}
	images, err := s.repo.GetQuestionImages(questionID)
	if err != nil {
		return
	}
	for _, img := range images {
		_ = s.minio.Delete(context.Background(), img.FileName)
		_ = s.repo.DeleteQuestionImage(img.FileName)
	}
}

func (s *Service) Delete(id, userID uint) error {
	q, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	if q.UserID != userID {
		return errors.New("bukan pemilik pertanyaan")
	}
	s.cleanupImages(id)
	return s.repo.Delete(id)
}

func (s *Service) AdminDelete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	s.cleanupImages(id)
	return s.repo.Delete(id)
}

func (s *Service) GetByID(id uint) (*models.Question, error) {
	return s.repo.GetByID(id)
}

func (s *Service) GetUser(userID uint) (*models.User, error) {
	return s.repo.GetUserByID(userID)
}
