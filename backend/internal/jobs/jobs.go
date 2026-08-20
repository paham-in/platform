package jobs

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"

	"bimbel2/backend/internal/notification"
	"bimbel2/backend/internal/storage"
	"bimbel2/backend/internal/tutoring"
	"bimbel2/backend/internal/user"

	"gorm.io/gorm"
)

// Runner membungkus background job yang berjalan di server. Dipakai dua
// cara: Start* meluncurkan goroutine berkala (cron), method yang sama
// dipanggil manual lewat endpoint admin untuk debug.
type Runner struct {
	sessionRepo   *user.SessionRepository
	tutoringRepo  *tutoring.Repository
	notifRepo     *notification.Repository
	objectStorage *storage.ObjectStorage
	retentionDays int
}

func New(db *gorm.DB, objectStorage *storage.ObjectStorage, retentionDays int) *Runner {
	return &Runner{
		sessionRepo:   user.NewSessionRepository(db),
		tutoringRepo:  tutoring.NewRepository(db),
		notifRepo:     notification.NewRepository(db),
		objectStorage: objectStorage,
		retentionDays: retentionDays,
	}
}

// SessionCleanup menghapus sesi yang sudah kedaluwarsa. Mengembalikan jumlah
// sesi yang dihapus.
func (r *Runner) SessionCleanup() (int64, error) {
	return r.sessionRepo.DeleteExpired(time.Now())
}

// EvidenceCleanup menghapus bukti kehadiran approved yang melewati masa simpan.
// Urutan: kosongkan evidence_url di DB dulu, baru hapus file dari storage.
// Kalau hapus file gagal, yang tersisa hanya file orphan, DB sudah tidak
// menunjuk ke file, jadi tidak ada broken link dan sesi tidak akan diproses
// ulang (tidak stuck). Mengembalikan jumlah bukti yang berhasil dihapus.
func (r *Runner) EvidenceCleanup() (int, error) {
	if r.objectStorage == nil {
		log.Println("[evidence-cleanup] storage tidak tersedia, cleanup dilewati")
		return 0, nil
	}
	cutoff := time.Now().AddDate(0, 0, -r.retentionDays)
	sessions, err := r.tutoringRepo.ListApprovedEvidenceOlderThan(cutoff)
	if err != nil {
		log.Printf("[evidence-cleanup] gagal query: %v", err)
		return 0, err
	}
	deleted := 0
	for _, s := range sessions {
		if s.EvidenceURL == "" {
			continue
		}
		// DB dulu, file belakangan. (S3 DeleteObject idempotent, file yang sudah
		// hilang bukan error, jadi tidak ada kasus "stuck" karena file tidak ada.)
		if err := r.tutoringRepo.ClearSessionEvidence(s.ID); err != nil {
			log.Printf("[evidence-cleanup] gagal kosongkan evidence sesi %d: %v", s.ID, err)
			continue
		}
		if err := r.objectStorage.Delete(context.Background(), s.EvidenceURL); err != nil {
			log.Printf("[evidence-cleanup] DB sudah dikosongkan, file %s gagal dihapus (orphan): %v", s.EvidenceURL, err)
			continue
		}
		deleted++
		log.Printf("[evidence-cleanup] bukti sesi %d dihapus", s.ID)
	}
	return deleted, nil
}

// StartSessionCleanup menjalankan cleanup sesi sekali saat boot, lalu tiap 1 jam.
// Panic di dalam job di-recover otomatis oleh cron.Recover, satu job yang
// panik tidak mematikan server, dan jadwal berikutnya tetap berjalan.
func (r *Runner) StartSessionCleanup() {
	r.runSessionCleanup() // sekali saat boot, lalu tiap jam
	c := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	if _, err := c.AddFunc("@hourly", r.runSessionCleanup); err != nil {
		log.Printf("[session-cleanup] gagal daftarkan jadwal: %v", err)
		return
	}
	c.Start()
}

func (r *Runner) runSessionCleanup() {
	deleted, err := r.SessionCleanup()
	if err != nil {
		log.Printf("[session-cleanup] gagal hapus sesi expired: %v", err)
		return
	}
	if deleted > 0 {
		log.Printf("[session-cleanup] %d sesi kedaluwarsa dihapus", deleted)
	}
}

// StartEvidenceCleanup menjalankan cleanup bukti tiap hari pukul 00:00.
// Panic di dalam job di-recover otomatis oleh cron.Recover, satu job yang
// panik tidak mematikan server, dan jadwal berikutnya tetap berjalan.
func (r *Runner) StartEvidenceCleanup() {
	if r.objectStorage == nil {
		log.Println("[evidence-cleanup] storage tidak tersedia, cleanup dilewati")
		return
	}
	c := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	if _, err := c.AddFunc("0 0 * * *", func() {
		r.EvidenceCleanup()
	}); err != nil {
		log.Printf("[evidence-cleanup] gagal daftarkan jadwal: %v", err)
		return
	}
	c.Start()
}

// TempImageCleanup menghapus gambar temp (prefix public/temp_*) yang berumur
// lebih dari 24 jam, upload yang ditinggalkan (form tidak pernah di-submit).
// Mengembalikan jumlah object yang dihapus.
func (r *Runner) TempImageCleanup() (int, error) {
	if r.objectStorage == nil {
		log.Println("[temp-image-cleanup] storage tidak tersedia, cleanup dilewati")
		return 0, nil
	}
	temps, err := r.objectStorage.ListTempImages(context.Background())
	if err != nil {
		log.Printf("[temp-image-cleanup] gagal list: %v", err)
		return 0, err
	}
	cutoff := time.Now().Add(-24 * time.Hour)
	deleted := 0
	for _, t := range temps {
		if t.LastModified.After(cutoff) {
			continue
		}
		if err := r.objectStorage.Delete(context.Background(), t.ObjectName); err != nil {
			log.Printf("[temp-image-cleanup] gagal hapus %s: %v", t.ObjectName, err)
			continue
		}
		deleted++
	}
	if deleted > 0 {
		log.Printf("[temp-image-cleanup] %d gambar temp dihapus", deleted)
	}
	return deleted, nil
}

// StartTempImageCleanup menjalankan cleanup gambar temp tiap hari pukul 00:00.
// Panic di dalam job di-recover otomatis oleh cron.Recover, satu job yang
// panik tidak mematikan server, dan jadwal berikutnya tetap berjalan.
func (r *Runner) StartTempImageCleanup() {
	if r.objectStorage == nil {
		log.Println("[temp-image-cleanup] storage tidak tersedia, cleanup dilewati")
		return
	}
	c := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	if _, err := c.AddFunc("0 0 * * *", func() {
		r.TempImageCleanup()
	}); err != nil {
		log.Printf("[temp-image-cleanup] gagal daftarkan jadwal: %v", err)
		return
	}
	c.Start()
}

// NotificationCleanup hard-deletes notifikasi yang sudah dibaca dan lebih dari 7 hari.
// Mengembalikan jumlah notifikasi yang dihapus.
func (r *Runner) NotificationCleanup() (int64, error) {
	cutoff := time.Now().AddDate(0, 0, -7)
	return r.notifRepo.DeleteReadOlderThan(cutoff)
}

// StartNotificationCleanup menjalankan cleanup notifikasi tiap hari pukul 00:00.
func (r *Runner) StartNotificationCleanup() {
	r.runNotificationCleanup()
	c := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	if _, err := c.AddFunc("0 0 * * *", r.runNotificationCleanup); err != nil {
		log.Printf("[notification-cleanup] gagal daftarkan jadwal: %v", err)
		return
	}
	c.Start()
}

func (r *Runner) runNotificationCleanup() {
	deleted, err := r.NotificationCleanup()
	if err != nil {
		log.Printf("[notification-cleanup] gagal hapus notifikasi: %v", err)
		return
	}
	if deleted > 0 {
		log.Printf("[notification-cleanup] %d notifikasi lama dihapus", deleted)
	}
}

