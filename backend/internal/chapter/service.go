package chapter

import (
	"context"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

type Service struct {
	repo  *Repository
	minio *storage.MinioClient
}

func NewService(repo *Repository, minio *storage.MinioClient) *Service {
	return &Service{repo: repo, minio: minio}
}

type ChapterResponse struct {
	ID            uint   `json:"id"`
	ClassID       uint   `json:"class_id"`
	SubjectID     uint   `json:"subject_id"`
	ClassName     string `json:"class_name"`
	SubjectName   string `json:"subject_name"`
	Title         string `json:"title"`
	Slug          string `json:"slug"`
	Description   string `json:"description"`
	CoverURL      string `json:"cover_url"`
	Order         int    `json:"order"`
	MaterialCount int64  `json:"material_count"`
}

func (s *Service) ListByClassSubject(classID, subjectID uint) ([]ChapterResponse, error) {
	chapters, err := s.repo.ListByClassSubject(classID, subjectID)
	if err != nil {
		return nil, err
	}
	return s.toResponses(chapters), nil
}

func (s *Service) List() ([]ChapterResponse, error) {
	chapters, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	return s.toResponses(chapters), nil
}

func (s *Service) Get(id uint) (*ChapterResponse, error) {
	chapter, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*chapter)
	return &r, nil
}

type CreateInput struct {
	ClassID     uint   `json:"class_id"`
	SubjectID   uint   `json:"subject_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
	Order       int    `json:"order"`
}

func (s *Service) Create(input CreateInput) (*ChapterResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(input.Title, " ", "-"))
	chapter := models.Chapter{
		ClassID:     input.ClassID,
		SubjectID:   input.SubjectID,
		Title:       input.Title,
		Slug:        slug,
		Description: input.Description,
		CoverURL:    input.CoverURL,
		Order:       input.Order,
	}
	if err := s.repo.Create(&chapter); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(chapter.ID)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	CoverURL    *string `json:"cover_url"`
	Order       *int    `json:"order"`
}

func (s *Service) Update(id uint, input UpdateInput) (*ChapterResponse, error) {
	updates := map[string]any{}
	if input.Title != nil {
		updates["title"] = *input.Title
		updates["slug"] = strings.ToLower(strings.ReplaceAll(*input.Title, " ", "-"))
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.CoverURL != nil {
		updates["cover_url"] = *input.CoverURL
	}
	if input.Order != nil {
		updates["order"] = *input.Order
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

func (s *Service) toResponse(c models.Chapter) ChapterResponse {
	className := ""
	subjectName := ""
	if c.Class.ID != 0 {
		className = c.Class.Name
	}
	if c.Subject.ID != 0 {
		subjectName = c.Subject.Name
	}
	count, _ := s.repo.MaterialCount(c.ID)
	coverURL := c.CoverURL
	if coverURL != "" && s.minio != nil {
		if presigned, err := s.minio.PresignedURL(context.Background(), coverURL, 24*time.Hour); err == nil {
			coverURL = presigned
		}
	}
	return ChapterResponse{
		ID:            c.ID,
		ClassID:       c.ClassID,
		SubjectID:     c.SubjectID,
		ClassName:     className,
		SubjectName:   subjectName,
		Title:         c.Title,
		Slug:          c.Slug,
		Description:   c.Description,
		CoverURL:      coverURL,
		Order:         c.Order,
		MaterialCount: count,
	}
}

func (s *Service) toResponses(chapters []models.Chapter) []ChapterResponse {
	result := make([]ChapterResponse, len(chapters))
	for i, c := range chapters {
		result[i] = s.toResponse(c)
	}
	return result
}
