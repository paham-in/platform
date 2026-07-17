package subject

import (
	"strings"

	"bimbel2/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type SubjectResponse struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	Slug           string `json:"slug"`
	Description    string `json:"description"`
	MaterialCount  int64  `json:"material_count"`
}

func (s *Service) List() ([]SubjectResponse, error) {
	subjects, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]SubjectResponse, len(subjects))
	for i, sub := range subjects {
		r := toResponse(sub)
		count, _ := s.repo.MaterialCount(sub.ID)
		r.MaterialCount = count
		result[i] = r
	}
	return result, nil
}

func (s *Service) Get(id uint) (*SubjectResponse, error) {
	sub, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := toResponse(*sub)
	return &r, nil
}

func (s *Service) Create(name, description string) (*SubjectResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	subject := models.Subject{
		Name:        name,
		Slug:        slug,
		Description: description,
	}
	if err := s.repo.Create(&subject); err != nil {
		return nil, err
	}
	r := toResponse(subject)
	return &r, nil
}

func (s *Service) Update(id uint, name, description string) (*SubjectResponse, error) {
	updates := map[string]interface{}{}
	if name != "" {
		updates["name"] = name
		updates["slug"] = strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	}
	if description != "" {
		updates["description"] = description
	}
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func toResponse(sub models.Subject) SubjectResponse {
	return SubjectResponse{
		ID:          sub.ID,
		Name:        sub.Name,
		Slug:        sub.Slug,
		Description: sub.Description,
	}
}
