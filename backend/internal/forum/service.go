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

func (s *Service) Create(userID uint, content string, subjectID *uint) (*models.ForumQuestion, error) {
	question := models.ForumQuestion{
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
