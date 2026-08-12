package devreset

import (
	"fmt"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/jobs"
	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Handler khusus utility development: hapus data per tabel untuk pengujian E2E.
// Tidak ada repository/service — langsung akses *gorm.DB.
type Handler struct {
	db   *gorm.DB
	cfg  *config.Config
	jobs *jobs.Runner
}

func NewHandler(db *gorm.DB, cfg *config.Config, jobRunner *jobs.Runner) *Handler {
	return &Handler{db: db, cfg: cfg, jobs: jobRunner}
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type TableInfo struct {
	Name        string `json:"name"`
	Label       string `json:"label"`
	Rows        int64  `json:"rows"`
	Protected   bool   `json:"protected"`
	Description string `json:"description,omitempty"`
}

type ListTablesResponse struct {
	Enabled bool        `json:"enabled"`
	Tables  []TableInfo `json:"tables"`
}

type ResetResponse struct {
	Table   string `json:"table"`
	Deleted int64  `json:"deleted"`
	Message string `json:"message"`
}

type RunJobResponse struct {
	Job     string `json:"job"`
	Deleted int64  `json:"deleted"`
	Message string `json:"message"`
}

type tableDef struct {
	name      string
	label     string
	desc      string
	protected bool
}

// whitelist tabel aplikasi. Urutan tidak penting — delete memakai
// DISABLE TRIGGER sehingga aman dari FK. "roles" & "user_roles" dilindungi
// (seed role & relasi admin, kalau hilang admin kehilangan akses).
var tables = []tableDef{
	{name: "users", label: "User", desc: "Semua user non-admin"},
	{name: "sessions", label: "Sesi", desc: "Semua sesi login kecuali sesi aktif"},
	{name: "classes", label: "Kelas", desc: "Kelas belajar"},
	{name: "subjects", label: "Mata Pelajaran", desc: "Mapel"},
	{name: "class_subjects", label: "Kelas–Mapel", desc: "Relasi kelas ke mapel"},
	{name: "chapters", label: "Bab", desc: "Bab materi"},
	{name: "materials", label: "Materi", desc: "Konten materi belajar"},
	{name: "questions", label: "Pertanyaan", desc: "Pertanyaan forum tanya jawab"},
	{name: "answers", label: "Jawaban", desc: "Jawaban forum tanya jawab"},
	{name: "question_images", label: "Gambar Pertanyaan", desc: "Gambar pada pertanyaan forum"},
	{name: "subject_images", label: "Gambar Mapel", desc: "Gambar pada mapel"},
	{name: "invoices", label: "Invoice", desc: "Tagihan pembayaran"},
	{name: "availabilities", label: "Ketersediaan Guru", desc: "Jadwal ketersediaan guru"},
	{name: "bookings", label: "Booking Les", desc: "Booking les privat"},
	{name: "tutoring_sessions", label: "Sesi Les", desc: "Sesi les privat + bukti kehadiran"},
	{name: "roles", label: "Role", desc: "Daftar role sistem", protected: true},
	{name: "user_roles", label: "Relasi User–Role", desc: "Relasi user ke role", protected: true},
	{name: "questionbank_questions", label: "Soal Bank", desc: "Soal paket soal"},
	{name: "questionbank_answers", label: "Jawaban Bank", desc: "Jawaban soal paket"},
	{name: "question_packages", label: "Paket Soal", desc: "Paket soal"},
	{name: "question_package_groups", label: "Grup Paket Soal", desc: "Grup paket soal per kelas"},
	{name: "teacher_subjects", label: "Guru–Mapel", desc: "Mapel yang diajar guru"},
	{name: "push_subscriptions", label: "Subs Push", desc: "Langganan notifikasi push"},
	{name: "programs", label: "Program", desc: "Program belajar"},
	{name: "student_classes", label: "Hak Akses Murid", desc: "Akses murid ke kelas"},
	{name: "settings", label: "Pengaturan", desc: "Konfigurasi aplikasi"},
}

func tableByName(name string) (tableDef, bool) {
	for _, t := range tables {
		if t.name == name {
			return t, true
		}
	}
	return tableDef{}, false
}

// ListTables mengembalikan status fitur + daftar tabel (admin only).
// Selalu diregistrasi (walau fitur dimatikan) supaya FE tahu harus
// menyembunyikan menu. Waktu disabled, `enabled` false + tables kosong.
// @Summary      List dev reset tables
// @Description  Status fitur reset + daftar tabel aplikasi beserta jumlah row (development)
// @Tags         Dev
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} ListTablesResponse
// @Router       /admin/dev/tables [get]
func (h *Handler) ListTables(c *fiber.Ctx) error {
	if !h.cfg.DevResetEnabled {
		return c.JSON(ListTablesResponse{Enabled: false, Tables: []TableInfo{}})
	}
	infos := make([]TableInfo, 0, len(tables))
	for _, t := range tables {
		var n int64
		h.db.Raw(fmt.Sprintf(`SELECT COUNT(*) FROM "%s"`, t.name)).Scan(&n)
		infos = append(infos, TableInfo{
			Name:        t.name,
			Label:       t.label,
			Rows:        n,
			Protected:   t.protected,
			Description: t.desc,
		})
	}
	return c.JSON(ListTablesResponse{Enabled: true, Tables: infos})
}

// ResetTable menghapus semua row di satu tabel (admin only)
// @Summary      Reset table
// @Description  Hapus semua row di tabel yang dipilih (development). Tabel dilindungi ditolak.
// @Tags         Dev
// @Produce      json
// @Security     BearerAuth
// @Param        table path string true "Nama tabel"
// @Success      200 {object} ResetResponse
// @Failure      400 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /admin/dev/tables/{table} [delete]
func (h *Handler) ResetTable(c *fiber.Ctx) error {
	name := c.Params("table")
	def, ok := tableByName(name)
	if !ok {
		return c.Status(404).JSON(ErrorResponse{Error: "tabel tidak dikenal"})
	}
	if def.protected {
		return c.Status(400).JSON(ErrorResponse{Error: "tabel dilindungi, tidak bisa dihapus"})
	}

	switch name {
	case "users":
		return h.resetUsers(c)
	case "sessions":
		return h.resetSessions(c)
	default:
		return h.resetNormal(c, name)
	}
}

// withTriggersDisabled menonaktifkan trigger (termasuk cek FK) pada tabel,
// menjalankan fn, lalu mengaktifkannya kembali. Tanpa superuser — cukup
// pemilik tabel — jadi aman buat dev DB biasa.
func (h *Handler) withTriggersDisabled(name string, fn func(db *gorm.DB) error) error {
	if err := h.db.Exec(fmt.Sprintf(`ALTER TABLE "%s" DISABLE TRIGGER ALL`, name)).Error; err != nil {
		return err
	}
	defer h.db.Exec(fmt.Sprintf(`ALTER TABLE "%s" ENABLE TRIGGER ALL`, name))
	return fn(h.db)
}

func (h *Handler) resetNormal(c *fiber.Ctx, name string) error {
	var deleted int64
	err := h.withTriggersDisabled(name, func(db *gorm.DB) error {
		res := db.Exec(fmt.Sprintf(`DELETE FROM "%s"`, name))
		if res.Error != nil {
			return res.Error
		}
		deleted = res.RowsAffected
		// reset sequence id; abaikan error (tabel tanpa serial id)
		db.Exec(fmt.Sprintf(`SELECT setval(pg_get_serial_sequence('%s','id'), 1, false)`, name))
		return nil
	})
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus " + name + ": " + err.Error()})
	}
	return c.JSON(ResetResponse{Table: name, Deleted: deleted, Message: "Data " + name + " dihapus"})
}

func (h *Handler) resetUsers(c *fiber.Ctx) error {
	var admin models.User
	if err := h.db.Where("email = ?", h.cfg.AdminEmail).First(&admin).Error; err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "admin tidak ditemukan"})
	}
	var deleted int64
	err := h.withTriggersDisabled("users", func(db *gorm.DB) error {
		// hapus user_roles + sessions + users dalam satu transaksi — kalau satu
		// langkah gagal, semua batal (bukan user tersisa separuh).
		return db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Exec(`DELETE FROM user_roles WHERE user_id != ?`, admin.ID).Error; err != nil {
				return err
			}
			if err := tx.Exec(`DELETE FROM sessions WHERE user_id != ?`, admin.ID).Error; err != nil {
				return err
			}
			res := tx.Exec(`DELETE FROM users WHERE id != ?`, admin.ID)
			if res.Error != nil {
				return res.Error
			}
			deleted = res.RowsAffected
			tx.Exec(`SELECT setval(pg_get_serial_sequence('users','id'), 1, false)`)
			return nil
		})
	})
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus user: " + err.Error()})
	}
	return c.JSON(ResetResponse{Table: "users", Deleted: deleted, Message: "Semua user non-admin dihapus"})
}

func (h *Handler) resetSessions(c *fiber.Ctx) error {
	token, _ := c.Locals("token").(string)
	res := h.db.Exec(`DELETE FROM sessions WHERE token != ?`, token)
	if res.Error != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus sesi: " + res.Error.Error()})
	}
	return c.JSON(ResetResponse{Table: "sessions", Deleted: res.RowsAffected, Message: "Semua sesi lain dihapus"})
}

// RunSessionCleanup menjalankan job pembersihan sesi kedaluwarsa secara manual
// @Summary      Run session cleanup job
// @Description  Jalankan manual job hapus sesi kedaluwarsa (development)
// @Tags         Dev
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} RunJobResponse
// @Failure      500 {object} ErrorResponse
// @Router       /admin/dev/cron/session-cleanup [post]
func (h *Handler) RunSessionCleanup(c *fiber.Ctx) error {
	deleted, err := h.jobs.SessionCleanup()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal bersihkan sesi: " + err.Error()})
	}
	return c.JSON(RunJobResponse{
		Job:     "session-cleanup",
		Deleted: deleted,
		Message: fmt.Sprintf("%d sesi kedaluwarsa dihapus", deleted),
	})
}

// RunEvidenceCleanup menjalankan job pembersihan bukti kehadiran lama secara manual
// @Summary      Run evidence cleanup job
// @Description  Jalankan manual job hapus bukti kehadiran approved yang lewat masa simpan (development)
// @Tags         Dev
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} RunJobResponse
// @Failure      500 {object} ErrorResponse
// @Router       /admin/dev/cron/evidence-cleanup [post]
func (h *Handler) RunEvidenceCleanup(c *fiber.Ctx) error {
	deleted, err := h.jobs.EvidenceCleanup()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal bersihkan bukti: " + err.Error()})
	}
	return c.JSON(RunJobResponse{
		Job:     "evidence-cleanup",
		Deleted: int64(deleted),
		Message: fmt.Sprintf("%d bukti kehadiran dihapus", deleted),
	})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, cfg *config.Config, jobRunner *jobs.Runner) {
	h := NewHandler(db, cfg, jobRunner)
	// GET selalu diregistrasi (FE butuh flag enabled buat hide menu).
	// DELETE/POST (yang menghapus/menjalankan) cuma ada kalau fitur dinyalakan.
	admin.Get("/dev/tables", h.ListTables)
	if cfg.DevResetEnabled {
		admin.Delete("/dev/tables/:table", h.ResetTable)
		admin.Post("/dev/cron/session-cleanup", h.RunSessionCleanup)
		admin.Post("/dev/cron/evidence-cleanup", h.RunEvidenceCleanup)
	}
}
