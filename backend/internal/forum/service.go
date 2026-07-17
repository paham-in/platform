package forum

import (
	"errors"

	"bimbel2/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(subjectID, userID *uint) ([]models.Question, error) {
	return s.repo.List(subjectID, userID)
}

func (s *Service) Create(userID uint, title, content string, subjectID *uint) (*models.Question, error) {
	question := models.Question{
		UserID:    userID,
		Title:     title,
		Content:   content,
		Status:    "open",
		SubjectID: subjectID,
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

func (s *Service) GetUser(userID uint) (*models.User, error) {
	return s.repo.GetUserByID(userID)
}
