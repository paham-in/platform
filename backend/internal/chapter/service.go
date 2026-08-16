package chapter

import (
	"context"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

type Service struct {
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, storage: store}
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

// ListScoped daftar chapter yang bisa diakses user. classIDs nil = semua
// kelas (staff); non-nil = kelas yang di-langgan student + chapter yang punya
// materi free published (free selalu bisa diakses tanpa langganan).
func (s *Service) ListScoped(classIDs []uint) ([]ChapterResponse, error) {
	chapters, err := s.repo.ListScoped(classIDs)
	if err != nil {
		return nil, err
	}
	return s.toResponses(chapters), nil
}

// ListByClassSubjectScoped daftar chapter dengan filter class+subject,
// tetap menghormati batas akses classIDs (sama seperti ListScoped).
func (s *Service) ListByClassSubjectScoped(classID, subjectID uint, classIDs []uint) ([]ChapterResponse, error) {
	chapters, err := s.repo.ListByClassSubjectScoped(classID, subjectID, classIDs)
	if err != nil {
		return nil, err
	}
	return s.toResponses(chapters), nil
}

// ListFiltered daftar chapter dengan filter opsional class_id/subject_id/search
// (masing-masing berdiri sendiri). classIDs nil = semua kelas (staff).
func (s *Service) ListFiltered(f ListFilter, classIDs []uint) ([]ChapterResponse, error) {
	var chapters []models.Chapter
	var err error
	if classIDs != nil {
		chapters, err = s.repo.ListFilteredScoped(f, classIDs)
	} else {
		chapters, err = s.repo.ListFiltered(f)
	}
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
	ClassID     *uint   `json:"class_id"`
	SubjectID   *uint   `json:"subject_id"`
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
	if input.ClassID != nil {
		updates["class_id"] = *input.ClassID
	}
	if input.SubjectID != nil {
		updates["subject_id"] = *input.SubjectID
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
	if coverURL != "" && s.storage != nil {
		if resolved, err := s.storage.URL(context.Background(), coverURL, 24*time.Hour); err == nil {
			coverURL = resolved
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
