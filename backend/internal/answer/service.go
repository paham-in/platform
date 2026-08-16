package answer

import (
	"context"
	"errors"
	"html"
	"log"
	"regexp"
	"strings"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/push"
	"bimbel2/backend/internal/storage"

	"gorm.io/gorm"
)

var reHTMLTag = regexp.MustCompile(`<[^>]*>`)

func stripHTML(s string) string {
	s = reHTMLTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.TrimSpace(s)
}

type Service struct {
	repo         *Repository
	questionRepo *QuestionRepository
	pushSvc      *push.Service
	store        *storage.ObjectStorage
}

func NewService(repo *Repository, questionRepo *QuestionRepository) *Service {
	return &Service{repo: repo, questionRepo: questionRepo}
}

// SetPushService menginjeksi push service untuk notifikasi (opsional).
func (s *Service) SetPushService(p *push.Service) {
	s.pushSvc = p
}

// SetStorage menginjeksi storage untuk membersihkan file gambar saat hapus jawaban.
func (s *Service) SetStorage(store *storage.ObjectStorage) {
	s.store = store
}

// commitContent memindahkan gambar temp ke lokasi permanen (kalau ada) lalu
// menormalkan semua referensi gambar di content ke bentuk object name.
func (s *Service) commitContent(content string) (string, error) {
	if s.store != nil {
		var err error
		content, err = s.store.CommitTempImages(context.Background(), content)
		if err != nil {
			return "", err
		}
	}
	return storage.SanitizeContentImages(content), nil
}

// RewriteContent mengganti object name gambar di content → URL akses (untuk serve).
func (s *Service) RewriteContent(content string) string {
	if s.store == nil {
		return content
	}
	return s.store.RewriteContentImages(content)
}

func (s *Service) ListByQuestion(questionID uint) ([]models.ForumAnswer, error) {
	return s.repo.ListByQuestion(questionID)
}

func (s *Service) Delete(id, userID uint) error {
	a, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("jawaban tidak ditemukan")
	}
	if a.UserID != userID {
		return errors.New("bukan pemilik jawaban")
	}

	objectNames, err := s.repo.DeleteWithAssets(id)
	if err != nil {
		return err
	}

	// hapus file gambar dari storage (best-effort — jangan gagalkan hapus
	// jawaban kalau storage bermasalah).
	if s.store != nil {
		for _, obj := range objectNames {
			if err := s.store.Delete(context.Background(), obj); err != nil {
				log.Printf("[answer] gagal hapus aset %q: %v", obj, err)
			}
		}
	}
	return nil
}

func (s *Service) Create(questionID, userID uint, content, videoURL string) (*models.ForumAnswer, error) {
	question, err := s.questionRepo.GetByID(questionID)
	if err != nil {
		return nil, errors.New("pertanyaan tidak ditemukan")
	}

	if question.UserID == userID {
		return nil, errors.New("tidak bisa menjawab pertanyaan sendiri")
	}

	committed, err := s.commitContent(content)
	if err != nil {
		return nil, err
	}

	answer := models.ForumAnswer{
		QuestionID:   questionID,
		UserID:       userID,
		Content:      committed,
		PlainContent: stripHTML(committed),
		VideoURL:     videoURL,
	}

	// Insert jawaban + aset content + update status pertanyaan dalam satu
	// transaksi — kalau update status gagal, jawaban ikut batal (bukan jawaban
	// yatim + status "open").
	if err := s.repo.db.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.CreateWithDB(tx, &answer); err != nil {
			return err
		}
		if err := s.repo.CreateAssetsWithDB(tx, answer.ID, storage.ExtractContentImages(committed)); err != nil {
			return err
		}
		return s.questionRepo.MarkAnsweredWithDB(tx, questionID)
	}); err != nil {
		return nil, err
	}

	// Kirim push notification ke pemilik pertanyaan (student).
	if s.pushSvc != nil {
		title := "Pertanyaanmu dijawab"
		body := stripHTML(content)
		if body == "" && videoURL != "" {
			body = "Menjawab dengan video"
		}
		if len(body) > 80 {
			body = body[:80] + "..."
		}
		s.pushSvc.NotifyUser(question.UserID, title, body, "/student/forum/"+formatUint(questionID))
	}

	// reload with User preloaded
	if err := s.repo.ReloadWithUser(&answer); err != nil {
		return nil, err
	}
	return &answer, nil
}

// formatUint helper kecil untuk mengubah uint jadi string.
func formatUint(v uint) string {
	if v == 0 {
		return "0"
	}
	buf := [20]byte{}
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	return string(buf[i:])
}

// Tiny repo interface for question lookup to avoid circular import
type QuestionRepository struct {
	db *gorm.DB
}

func NewQuestionRepository(db *gorm.DB) *QuestionRepository {
	return &QuestionRepository{db: db}
}

func (r *QuestionRepository) GetByID(id uint) (*models.ForumQuestion, error) {
	var q models.ForumQuestion
	if err := r.db.First(&q, id).Error; err != nil {
		return nil, err
	}
	return &q, nil
}

// MarkAnswered mengubah status pertanyaan menjadi "answered" jika masih "open".
func (r *QuestionRepository) MarkAnswered(id uint) error {
	return r.MarkAnsweredWithDB(r.db, id)
}

// MarkAnsweredWithDB sama dengan MarkAnswered tapi memakai koneksi tertentu
// (bisa tx).
func (r *QuestionRepository) MarkAnsweredWithDB(db *gorm.DB, id uint) error {
	return db.Model(&models.ForumQuestion{}).
		Where("id = ? AND status = ?", id, "open").
		Update("status", "answered").Error
}
