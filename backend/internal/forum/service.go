package forum

import (
	"context"
	"errors"
	"html"
	"log"
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
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// SetStorage menginjeksi object storage (opsional — dipakai untuk menghapus
// file gambar saat pertanyaan dihapus).
func (s *Service) SetStorage(store *storage.ObjectStorage) {
	s.storage = store
}

// deleteWithCleanup menghapus pertanyaan secara hard + atomic bersama jawaban
// dan gambar (satu transaksi DB), lalu menghapus file gambar dari storage.
// Penghapusan storage best-effort setelah commit: kalau gagal hanya di-log,
// request tetap sukses karena data DB sudah bersih (file orphan lebih aman
// daripada DB yang tidak konsisten).
func (s *Service) deleteWithCleanup(id uint) error {
	fileNames, err := s.repo.DeleteHard(id)
	if err != nil {
		return err
	}
	if s.storage != nil {
		for _, fn := range fileNames {
			if err := s.storage.Delete(context.Background(), fn); err != nil {
				log.Printf("[forum] gagal hapus gambar %q: %v", fn, err)
			}
		}
	}
	return nil
}

func (s *Service) List(subjectID, userID *uint, unanswered bool) ([]models.ForumQuestion, error) {
	return s.repo.List(subjectID, userID, unanswered)
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

// RewriteContent mengganti object name gambar di content → URL akses (untuk serve).
func (s *Service) RewriteContent(content string) string {
	if s.storage == nil {
		return content
	}
	return s.storage.RewriteContentImages(content)
}

func (s *Service) Create(userID uint, content string, subjectID *uint) (*models.ForumQuestion, error) {
	committed, err := s.commitContent(content)
	if err != nil {
		return nil, err
	}
	question := models.ForumQuestion{
		UserID:       userID,
		Content:      committed,
		PlainContent: stripHTML(committed),
		Status:       "open",
		SubjectID:    subjectID,
	}
	if err := s.repo.CreateWithAssets(&question, storage.ExtractContentImages(committed)); err != nil {
		return nil, err
	}
	return &question, nil
}

// Update memperbarui content pertanyaan (hanya pemilik). Gambar temp di-commit
// ke permanen, lalu aset content di-diff dengan DB: gambar yang sudah tidak ada
// di content ikut dihapus filenya dari storage.
func (s *Service) Update(id, userID uint, content string, subjectID *uint) (*models.ForumQuestion, error) {
	q, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("pertanyaan tidak ditemukan")
	}
	if q.UserID != userID {
		return nil, errors.New("bukan pemilik pertanyaan")
	}
	committed, err := s.commitContent(content)
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
	if err := s.repo.UpdateContentWithAssets(id, committed, stripHTML(committed), subjectID, newAssets); err != nil {
		return nil, err
	}
	if s.storage != nil {
		for _, obj := range removed {
			if err := s.storage.Delete(context.Background(), obj); err != nil {
				log.Printf("[forum] gagal hapus aset %q: %v", obj, err)
			}
		}
	}
	return s.repo.GetByID(id)
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

func (s *Service) Delete(id, userID uint) error {
	q, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	if q.UserID != userID {
		return errors.New("bukan pemilik pertanyaan")
	}
	return s.deleteWithCleanup(id)
}

func (s *Service) AdminDelete(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("pertanyaan tidak ditemukan")
	}
	return s.deleteWithCleanup(id)
}

func (s *Service) GetByID(id uint) (*models.ForumQuestion, error) {
	return s.repo.GetByID(id)
}

func (s *Service) GetUser(userID uint) (*models.User, error) {
	return s.repo.GetUserByID(userID)
}
