package material

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

type MaterialResponse struct {
	ID          uint   `json:"id"`
	ChapterID   uint   `json:"chapter_id"`
	ChapterName string `json:"chapter_name"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Status      string `json:"status"`
	Order       int    `json:"order"`
}

func (s *Service) List() ([]MaterialResponse, error) {
	materials, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	return toResponses(materials), nil
}

func (s *Service) ListByChapter(chapterID uint) ([]MaterialResponse, error) {
	materials, err := s.repo.ListByChapter(chapterID)
	if err != nil {
		return nil, err
	}
	return toResponses(materials), nil
}

func (s *Service) Get(id uint) (*MaterialResponse, error) {
	material, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := toResponse(*material)
	return &r, nil
}

type CreateInput struct {
	ChapterID   uint   `json:"chapter_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Status      string `json:"status"`
	Order       int    `json:"order"`
}

func (s *Service) Create(input CreateInput) (*MaterialResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(input.Title, " ", "-"))
	material := models.Material{
		ChapterID:   input.ChapterID,
		Title:       input.Title,
		Slug:        slug,
		Description: input.Description,
		Content:     input.Content,
		Status:      input.Status,
		Order:       input.Order,
	}
	if material.Status == "" {
		material.Status = "draft"
	}
	if err := s.repo.Create(&material); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(material.ID)
	if err != nil {
		return nil, err
	}
	r := toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Title       *string `json:"title"`
	ChapterID   *uint   `json:"chapter_id"`
	Description *string `json:"description"`
	Content     *string `json:"content"`
	Status      *string `json:"status"`
	Order       *int    `json:"order"`
}

func (s *Service) Update(id uint, input UpdateInput) (*MaterialResponse, error) {
	updates := map[string]any{}
	if input.Title != nil {
		updates["title"] = *input.Title
		updates["slug"] = strings.ToLower(strings.ReplaceAll(*input.Title, " ", "-"))
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.Content != nil {
		updates["content"] = *input.Content
	}
	if input.Status != nil {
		updates["status"] = *input.Status
	}
	if input.Order != nil {
		updates["order"] = *input.Order
	}
	if input.ChapterID != nil {
		updates["chapter_id"] = *input.ChapterID
	}
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func toResponse(m models.Material) MaterialResponse {
	chapterName := ""
	if m.Chapter.ID != 0 {
		chapterName = m.Chapter.Title
	}
	return MaterialResponse{
		ID:          m.ID,
		ChapterID:   m.ChapterID,
		ChapterName: chapterName,
		Title:       m.Title,
		Slug:        m.Slug,
		Description: m.Description,
		Content:     m.Content,
		Status:      m.Status,
		Order:       m.Order,
	}
}

func toResponses(materials []models.Material) []MaterialResponse {
	result := make([]MaterialResponse, len(materials))
	for i, m := range materials {
		result[i] = toResponse(m)
	}
	return result
}
