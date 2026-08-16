package material

import (
	"context"
	"errors"
	"log"
	"strings"

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

// Access mewakili hak akses pemanggil terhadap materi.
// CallerID = id user yang login; IsAdmin = punya role admin;
// IsStaff = admin atau teacher (boleh lihat draft miliknya / belum ber-pemilik).
type Access struct {
	CallerID uint
	IsAdmin  bool
	IsStaff  bool
}

var (
	// ErrNotFound dipakai juga utk akses baca yang ditolak (hindari
	// membocorkan keberadaan materi milik guru lain).
	ErrNotFound = errors.New("materi tidak ditemukan")
	// ErrNotOwner dipakai utk tulis materi milik guru lain.
	ErrNotOwner = errors.New("bukan materi kamu")
)

// canView: published boleh dilihat semua; draft hanya admin, penulisnya, atau
// materi tanpa pemilik (author_id=0 — materi lama yang belum di-claim).
func (s *Service) canView(m *models.Material, a Access) bool {
	if a.IsAdmin || m.Status == "published" {
		return true
	}
	if !a.IsStaff {
		return false
	}
	return m.AuthorID == a.CallerID || m.AuthorID == 0
}

// canManage: admin selalu; selain admin hanya penulisnya atau materi tanpa pemilik.
func (s *Service) canManage(m *models.Material, a Access) bool {
	if a.IsAdmin {
		return true
	}
	return m.AuthorID == a.CallerID || m.AuthorID == 0
}

type MaterialResponse struct {
	ID          uint   `json:"id"`
	ChapterID   uint   `json:"chapter_id"`
	AuthorID    uint   `json:"author_id,omitempty"`
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

func (s *Service) List(a Access) ([]MaterialResponse, error) {
	var materials []models.Material
	var err error
	if a.IsAdmin {
		materials, err = s.repo.List()
	} else {
		materials, err = s.repo.ListScoped(a.CallerID)
	}
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

func (s *Service) ListByChapter(chapterID uint, a Access) ([]MaterialResponse, error) {
	var materials []models.Material
	var err error
	if a.IsAdmin {
		materials, err = s.repo.ListByChapter(chapterID)
	} else {
		materials, err = s.repo.ListByChapterScoped(chapterID, a.CallerID)
	}
	if err != nil {
		return nil, err
	}
	return s.toResponses(materials), nil
}

// ListFiltered daftar materi dengan filter opsional chapter_id, search, access,
// type, status. Non-admin tetap dibatasi scoped (published/milik sendiri).
func (s *Service) ListFiltered(chapterID *uint, search, access, type_, status string, a Access) ([]MaterialResponse, error) {
	var materials []models.Material
	var err error
	if a.IsAdmin {
		materials, err = s.repo.ListFiltered(chapterID, search, access, type_, status)
	} else {
		materials, err = s.repo.ListFilteredScoped(chapterID, search, access, type_, status, a.CallerID)
	}
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

func (s *Service) Get(id uint, a Access) (*MaterialResponse, error) {
	material, err := s.repo.Get(id)
	if err != nil {
		return nil, ErrNotFound
	}
	if !s.canView(material, a) {
		return nil, ErrNotFound
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

// commitContent memindahkan gambar temp ke lokasi permanen (kalau ada) lalu
// menormalkan semua referensi gambar di content ke bentuk object name.
func (s *Service) commitContent(content string) (string, error) {
	if s.storage != nil {
		var err error
		content, err = s.storage.CommitTempImages(context.Background(), content)
		if err != nil {
			return "", err
		}
	}
	return storage.SanitizeContentImages(content), nil
}

func (s *Service) Create(input CreateInput, authorID uint) (*MaterialResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(input.Title, " ", "-"))
	committed, err := s.commitContent(input.Content)
	if err != nil {
		return nil, err
	}
	material := models.Material{
		ChapterID:   input.ChapterID,
		AuthorID:    authorID,
		Title:       input.Title,
		Slug:        slug,
		Description: input.Description,
		Type:        input.Type,
		Content:     committed,
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
	if err := s.repo.CreateWithAssets(&material, storage.ExtractContentImages(committed)); err != nil {
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

func (s *Service) Update(id uint, input UpdateInput, a Access) (*MaterialResponse, error) {
	material, err := s.repo.Get(id)
	if err != nil {
		return nil, ErrNotFound
	}
	if !s.canManage(material, a) {
		return nil, ErrNotOwner
	}
	updates := map[string]any{}
	if input.Title != nil {
		updates["title"] = *input.Title
		updates["slug"] = strings.ToLower(strings.ReplaceAll(*input.Title, " ", "-"))
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.Content != nil {
		// commit gambar temp baru, lalu diff aset content dengan DB: gambar yang
		// sudah tidak ada di content ikut dihapus filenya.
		committed, err := s.commitContent(*input.Content)
		if err != nil {
			return nil, err
		}
		newAssets := storage.ExtractContentImages(committed)
		var removed []string
		if s.storage != nil {
			oldAssets, err := s.repo.ListAssetObjectNames(id)
			if err != nil {
				return nil, err
			}
			removed = difference(oldAssets, newAssets)
		}
		if err := s.repo.UpdateContentWithAssets(id, committed, newAssets); err != nil {
			return nil, err
		}
		if s.storage != nil {
			for _, obj := range removed {
				if err := s.storage.Delete(context.Background(), obj); err != nil {
					log.Printf("[material] gagal hapus aset %q: %v", obj, err)
				}
			}
		}
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
	if !a.IsAdmin && material.AuthorID == 0 {
		// materi lama tanpa pemilik di-claim oleh guru pertama yang mengeditnya
		updates["author_id"] = a.CallerID
	}
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}
	return s.Get(id, a)
}

func (s *Service) Delete(id uint, a Access) error {
	material, err := s.repo.Get(id)
	if err != nil {
		return ErrNotFound
	}
	if !s.canManage(material, a) {
		return ErrNotOwner
	}
	// hapus materi + aset content dari DB, lalu bersihkan file gambar dari
	// storage (best-effort setelah commit — file orphan lebih aman daripada
	// DB yang tidak konsisten).
	assetNames, err := s.repo.DeleteWithAssets(id)
	if err != nil {
		return err
	}
	if s.storage != nil {
		for _, obj := range assetNames {
			if err := s.storage.Delete(context.Background(), obj); err != nil {
				log.Printf("[material] gagal hapus aset %q: %v", obj, err)
			}
		}
	}
	return nil
}

// difference mengembalikan elemen a yang tidak ada di b.
func difference(a, b []string) []string {
	inB := make(map[string]bool, len(b))
	for _, x := range b {
		inB[x] = true
	}
	var out []string
	for _, x := range a {
		if !inB[x] {
			out = append(out, x)
		}
	}
	return out
}

func (s *Service) toResponse(m models.Material) MaterialResponse {
	chapterName := ""
	if m.Chapter.ID != 0 {
		chapterName = m.Chapter.Title
	}
	return MaterialResponse{
		ID:          m.ID,
		ChapterID:   m.ChapterID,
		AuthorID:    m.AuthorID,
		ClassID:     m.Chapter.ClassID,
		ChapterName: chapterName,
		Title:       m.Title,
		Slug:        m.Slug,
		Description: m.Description,
		Type:        m.Type,
		Content:     s.storage.RewriteContentImages(m.Content),
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
