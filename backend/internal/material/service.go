package material

import (
	"context"
	"regexp"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

// objectNameRe mencocokkan referensi gambar storage di dalam HTML content.
// Bentuk tersimpan: `public/materials/<uuid>.<ext>` (baru) atau
// `forum/<uuid>.<ext>` (legacy). Bisa juga berawalan URL (presigned lama /
// public base) — prefix URL ikut di-capture untuk dinormalisasi. Query string
// presigned (X-Amz-*) ikut dikonsumsi supaya tidak tersisa saat strip.
var objectNameRe = regexp.MustCompile(`(?:https?://[^"'\s]+/)?((?:public/materials|forum)/[0-9a-fA-F-]+\.(?:jpg|jpeg|png|gif|webp))(?:\?[^"'\s]*)?`)

// sanitizeContentImages menormalkan presigned URL → objectName (group 1).
// Dipakai pas simpan: content dari editor bisa kebawa presigned URL fresh
// (karena serve selalu rewrite), harus dikembalikan ke objectName biar
// stabil & tidak expire.
func sanitizeContentImages(content string) string {
	return objectNameRe.ReplaceAllString(content, "$1")
}

type Service struct {
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, storage: store}
}

type MaterialResponse struct {
	ID          uint   `json:"id"`
	ChapterID   uint   `json:"chapter_id"`
	ClassID     uint   `json:"class_id"`
	ChapterName string `json:"chapter_name"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Content     string `json:"content"`
	VideoURL    string `json:"video_url"`
	Status      string `json:"status"`
	IsFree      bool   `json:"is_free"`
	Order       int    `json:"order"`
}

func (s *Service) List() ([]MaterialResponse, error) {
	materials, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

func (s *Service) ListByChapter(chapterID uint) ([]MaterialResponse, error) {
	materials, err := s.repo.ListByChapter(chapterID)
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

// ListPublished untuk akses murid/user — hanya materi published.
// includePremium=false membatasi ke materi free saja.
// classIDs non-nil membatasi premium ke kelas tertentu; nil = semua kelas (staff).
func (s *Service) ListPublished(includePremium bool, classIDs []uint) ([]MaterialResponse, error) {
	materials, err := s.repo.ListPublished(includePremium, classIDs)
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

func (s *Service) ListPublishedByChapter(chapterID uint, includePremium bool, classIDs []uint) ([]MaterialResponse, error) {
	materials, err := s.repo.ListPublishedByChapter(chapterID, includePremium, classIDs)
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

func (s *Service) Get(id uint) (*MaterialResponse, error) {
	material, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*material)
	return &r, nil
}

type CreateInput struct {
	ChapterID   uint   `json:"chapter_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Content     string `json:"content"`
	VideoURL    string `json:"video_url"`
	Status      string `json:"status"`
	IsFree      bool   `json:"is_free"`
	Order       int    `json:"order"`
}

func (s *Service) Create(input CreateInput) (*MaterialResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(input.Title, " ", "-"))
	material := models.Material{
		ChapterID:   input.ChapterID,
		Title:       input.Title,
		Slug:        slug,
		Description: input.Description,
		Type:        input.Type,
		Content:     sanitizeContentImages(input.Content),
		VideoURL:    input.VideoURL,
		Status:      input.Status,
		IsFree:      input.IsFree,
		Order:       input.Order,
	}
	if material.Type == "" {
		material.Type = "text"
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
	r := s.toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Title       *string `json:"title"`
	ChapterID   *uint   `json:"chapter_id"`
	Description *string `json:"description"`
	Type        *string `json:"type"`
	Content     *string `json:"content"`
	VideoURL    *string `json:"video_url"`
	Status      *string `json:"status"`
	IsFree      *bool   `json:"is_free"`
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
		updates["content"] = sanitizeContentImages(*input.Content)
	}
	if input.Type != nil {
		updates["type"] = *input.Type
	}
	if input.VideoURL != nil {
		updates["video_url"] = *input.VideoURL
	}
	if input.Status != nil {
		updates["status"] = *input.Status
	}
	if input.IsFree != nil {
		updates["is_free"] = *input.IsFree
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

func (s *Service) toResponse(m models.Material) MaterialResponse {
	chapterName := ""
	if m.Chapter.ID != 0 {
		chapterName = m.Chapter.Title
	}
	return MaterialResponse{
		ID:          m.ID,
		ChapterID:   m.ChapterID,
		ClassID:     m.Chapter.ClassID,
		ChapterName: chapterName,
		Title:       m.Title,
		Slug:        m.Slug,
		Description: m.Description,
		Type:        m.Type,
		Content:     s.rewriteContentImages(m.Content),
		VideoURL:    m.VideoURL,
		Status:      m.Status,
		IsFree:      m.IsFree,
		Order:       m.Order,
	}
}

func (s *Service) toResponses(materials []models.Material) []MaterialResponse {
	result := make([]MaterialResponse, len(materials))
	for i, m := range materials {
		result[i] = s.toResponse(m)
	}
	return result
}

// rewriteContentImages mengganti objectName di HTML content → URL akses.
// Content di DB selalu objectName (lihat sanitizeContentImages). `public/materials/`
// → URL publik langsung; legacy `forum/` & `private/` → presigned URL. Di-rewrite
// tiap serve biar stabil (presigned expire).
func (s *Service) rewriteContentImages(content string) string {
	if s.storage == nil {
		return content
	}
	return objectNameRe.ReplaceAllStringFunc(content, func(m string) string {
		obj := objectNameRe.FindStringSubmatch(m)[1]
		if url, err := s.storage.URL(context.Background(), obj, 24*time.Hour); err == nil {
			return url
		}
		return obj
	})
}
