package push

import (
	"encoding/json"
	"log"

	"bimbel2/backend/internal/models"

	webpush "github.com/SherClockHolmes/webpush-go"
	"gorm.io/gorm"
)

type Service struct {
	db              *gorm.DB
	vapidPublicKey  string
	vapidPrivateKey string
	vapidSubject    string
}

func NewService(db *gorm.DB, vapidPublicKey, vapidPrivateKey, vapidSubject string) *Service {
	return &Service{
		db:              db,
		vapidPublicKey:  vapidPublicKey,
		vapidPrivateKey: vapidPrivateKey,
		vapidSubject:    vapidSubject,
	}
}

// Subscribe menyimpan subscription push milik user.
// Jika endpoint sama sudah ada, update keys-nya (upsert).
func (s *Service) Subscribe(userID uint, endpoint, keysP256, keysAuth string) error {
	var existing models.PushSubscription
	err := s.db.Where("user_id = ? AND endpoint = ?", userID, endpoint).First(&existing).Error
	if err == nil {
		// update keys kalau berubah
		return s.db.Model(&existing).Updates(map[string]any{
			"keys_p256": keysP256,
			"keys_auth": keysAuth,
		}).Error
	}

	sub := models.PushSubscription{
		UserID:   userID,
		Endpoint: endpoint,
		KeysP256: keysP256,
		KeysAuth: keysAuth,
	}
	return s.db.Create(&sub).Error
}

// NotifyUser mengirim push notification ke semua subscription milik user.
func (s *Service) NotifyUser(userID uint, title, body, url string) {
	if s.vapidPublicKey == "" || s.vapidPrivateKey == "" {
		log.Printf("[push] VAPID keys belum dikonfigurasi, skip notif ke user %d", userID)
		return
	}

	var subs []models.PushSubscription
	if err := s.db.Where("user_id = ?", userID).Find(&subs).Error; err != nil {
		log.Printf("[push] gagal ambil subscription user %d: %v", userID, err)
		return
	}

	for _, sub := range subs {
		payload := map[string]string{
			"title": title,
			"body":  body,
			"url":   url,
		}
		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			continue
		}

		subObj := webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.KeysP256,
				Auth:   sub.KeysAuth,
			},
		}

		resp, err := webpush.SendNotification(jsonPayload, &subObj, &webpush.Options{
			Subscriber:      s.vapidSubject,
			VAPIDPublicKey:  s.vapidPublicKey,
			VAPIDPrivateKey: s.vapidPrivateKey,
			TTL:             60,
		})
		if err != nil {
			log.Printf("[push] gagal kirim ke %s: %v", sub.Endpoint, err)
			continue
		}
		// 404/410 → subscription tidak valid lagi, hapus.
		if resp != nil && (resp.StatusCode == 404 || resp.StatusCode == 410) {
			s.db.Delete(&models.PushSubscription{}, sub.ID)
		}
	}
}
