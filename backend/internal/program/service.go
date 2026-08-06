package program

import (
	"errors"
	"strings"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type ClassInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ProgramResponse struct {
	ID          uint        `json:"id"`
	Name        string      `json:"name"`
	Slug        string      `json:"slug"`
	Description string      `json:"description"`
	Classes     []ClassInfo `json:"classes"`
	CreatedAt   string      `json:"created_at"`
}

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
}

func (s *Service) List() ([]ProgramResponse, error) {
	programs, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]ProgramResponse, len(programs))
	for i, p := range programs {
		classes, _ := s.repo.ListClasses(p.ID)
		result[i] = toResponse(p, classes)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*ProgramResponse, error) {
	p, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	classes, _ := s.repo.ListClasses(p.ID)
	r := toResponse(*p, classes)
	return &r, nil
}

type CreateInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (s *Service) Create(input CreateInput) (*ProgramResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama program wajib diisi")
	}
	slug := strings.ToLower(strings.ReplaceAll(input.Name, " ", "-"))
	// pastikan slug unik
	if _, err := s.repo.GetBySlug(slug); err == nil {
		return nil, errors.New("program dengan nama/slug ini sudah ada")
	}
	p := models.Program{Name: input.Name, Slug: slug, Desc: input.Description}
	if err := s.repo.Create(&p); err != nil {
		return nil, err
	}
	r := toResponse(p, nil)
	return &r, nil
}

type UpdateInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

func (s *Service) Update(id uint, input UpdateInput) (*ProgramResponse, error) {
	updates := map[string]any{}
	if input.Name != nil {
		updates["name"] = *input.Name
		updates["slug"] = strings.ToLower(strings.ReplaceAll(*input.Name, " ", "-"))
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) AssignClass(programID, classID uint) error {
	return s.repo.AssignClass(programID, classID)
}

func (s *Service) UnassignClass(classID uint) error {
	return s.repo.UnassignClass(classID)
}

func toResponse(p models.Program, classes []models.Class) ProgramResponse {
	ci := make([]ClassInfo, len(classes))
	for i, c := range classes {
		ci[i] = ClassInfo{ID: c.ID, Name: c.Name}
	}
	return ProgramResponse{
		ID:          p.ID,
		Name:        p.Name,
		Slug:        p.Slug,
		Description: p.Desc,
		Classes:     ci,
		CreatedAt:   p.CreatedAt.Format("2006-01-02"),
	}
}
