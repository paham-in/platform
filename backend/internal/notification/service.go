package notification

import (
	"log"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/push"
)

type Service struct {
	repo    *Repository
	pushSvc *push.Service
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetPushService(p *push.Service) {
	s.pushSvc = p
}

// Notify membuat in-app notification + kirim push (best-effort).
func (s *Service) Notify(userID uint, title, body, notifType, url string) {
	n := models.Notification{
		UserID: userID,
		Title:  title,
		Body:   body,
		Type:   notifType,
		URL:    url,
		IsRead: false,
	}
	if err := s.repo.Create(&n); err != nil {
		log.Printf("[notification] gagal simpan notif ke user %d: %v", userID, err)
		return
	}

	if s.pushSvc != nil {
		s.pushSvc.NotifyUser(userID, title, body, url)
	}
}

// NotifyBatch membuat in-app notification untuk banyak user sekaligus + push.
func (s *Service) NotifyBatch(userIDs []uint, title, body, notifType, url string) {
	if len(userIDs) == 0 {
		return
	}

	notifications := make([]models.Notification, len(userIDs))
	for i, uid := range userIDs {
		notifications[i] = models.Notification{
			UserID: uid,
			Title:  title,
			Body:   body,
			Type:   notifType,
			URL:    url,
			IsRead: false,
		}
	}
	if err := s.repo.CreateBatch(notifications); err != nil {
		log.Printf("[notification] gagal batch simpan notif: %v", err)
		return
	}

	if s.pushSvc != nil {
		for _, uid := range userIDs {
			s.pushSvc.NotifyUser(uid, title, body, url)
		}
	}
}

type NotificationResponse struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	Type      string `json:"type"`
	URL       string `json:"url"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}

func (s *Service) ListByUser(userID uint, limit, offset int) ([]NotificationResponse, int64, error) {
	notifications, total, err := s.repo.ListByUser(userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]NotificationResponse, len(notifications))
	for i, n := range notifications {
		result[i] = NotificationResponse{
			ID:        n.ID,
			Title:     n.Title,
			Body:      n.Body,
			Type:      n.Type,
			URL:       n.URL,
			IsRead:    n.IsRead,
			CreatedAt: n.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return result, total, nil
}

func (s *Service) UnreadCount(userID uint) (int64, error) {
	return s.repo.UnreadCount(userID)
}

func (s *Service) GetByPublicID(publicID string) (*models.Notification, error) {
	return s.repo.GetByPublicID(publicID)
}

func (s *Service) MarkRead(userID, id uint) error {
	return s.repo.MarkRead(userID, id)
}

func (s *Service) MarkAllRead(userID uint) error {
	return s.repo.MarkAllRead(userID)
}

// Helper: ambil teacher IDs berdasarkan subject
func (s *Service) ListTeacherIDsBySubject(subjectID uint) ([]uint, error) {
	return s.repo.ListTeacherIDsBySubject(subjectID)
}

// Helper: ambil semua teacher IDs
func (s *Service) ListAllTeacherIDs() ([]uint, error) {
	return s.repo.ListTeacherIDs()
}
