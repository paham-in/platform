# Report Pembersihan DB — Kolom/Tabel Tak Terpakai

**Target DB:** `bimbel2_dev` @ `stb` (PostgreSQL)
**Tanggal audit:** 2026-08-08
**Metode:**
1. Baca 24 model GORM di `backend/internal/models/`
2. Introspect schema DB live via query read-only → daftar kolom semua tabel + row count
3. Grep referensi kode backend (`backend/internal/**/*.go`) + frontend (`web/src/**`) untuk tiap kandidat
4. Cek riwayat commit + migrasi (`backend/internal/database/database.go`) untuk konteks legacy

**Status:** Report saja. Belum ada yang dihapus.

---

## Tier 1 — Mati total, aman hapus (0 referensi kode)

| # | Target | Tipe | Data di DB | Alasan |
|---|--------|------|-----------|--------|
| 1 | `users.role` | kolom | 2 `admin`, 2 `student` | Model `User` (`backend/internal/models/user.go`) tidak punya field `role`. Role via many2many `user_roles`/`roles`; filter role di `backend/internal/user/user_repository.go:46` pakai `EXISTS(...user_roles...)`. Sisa era sebelum commit `6f578af` (hapus role "user"). 0 kode baca/tulis. |
| 2 | `materials.video_source` | kolom | 4 `youtube`, 3 `minio` | Model `Material` (`backend/internal/models/material.go`) tidak punya field. Grep `video_source` seluruh repo = 0 hit. Sisa sistem video lama; sekarang tipe video via `materials.type` + `video_url`. |
| 3 | tabel `question_banks` | tabel | 0 baris | Tabel lama bank soal chapter-based, digantikan `questionbank_questions` + `questionbank_answers` + `question_packages` (migrasi `backend/internal/database/database.go:156-168`). Satu-satunya referensi: komentar `TableName` di `backend/internal/models/questionbank_question.go`. Bukan bagian dari AutoMigrate. |

## Tier 2 — Kandidat, butuh keputusan

| # | Target | Tipe | Data | Alasan |
|---|--------|------|------|--------|
| 4 | `users.payment_status` | kolom | 4 `pending` | Tidak ada UI web yang baca/tulis (grep `web/src` = 0). Sisa sistem langganan lama; akses premium sekarang real-time dari `invoices` → `student_classes`. TAPI endpoint backend `PATCH /admin/users/:id/payment` (`backend/internal/user/handler.go:234-256`, `UpdatePaymentStatus` di `backend/internal/user/user_repository.go:81`) masih ada & menulis kolom ini. **Keputusan**: hapus kolom + endpoint sekaligus, atau biarkan sampai endpoint dibersihkan. |

## Dicek & Dipertahankan (bukan item hapus)

Kolom/tabel berikut dicek dan **masih dipakai** kode — jangan dihapus:

- `users.avatar_url`, `users.google_id` — OAuth Google, ditampilkan di avatar
- `bookings.group_token` — join grup kelompok
- `questions.plain_content`, `answers.plain_content` — search & preview forum
- `questionbank_questions.explanation` — pembahasan paket soal
- `bookings.note`, `invoices.note` — ditampilkan di halaman admin/teacher/student
- `programs.desc`, `question_packages.description` — ditampilkan di web
- `classes.price_per_session`, `classes.group_price` — harga les privat
- `materials.video_url`, `answers.video_url` — video materi/jawaban
- `subject_images.*` — gallery subject
- kolom lain di `push_subscriptions`, `sessions`, `availabilities`, `tutoring_sessions`, dst.

**Sudah di-drop migrasi sebelumnya** (tidak muncul lagi di DB, hanya catatan):
`classes.description`, `subjects.description`, `questions.title`, `questions.upvotes`, `question_images.url`, `materials.subject_id`.

---

## SQL Cleanup (opsional, TIDAK dijalankan)

```sql
-- Tier 1 (aman)
ALTER TABLE users DROP COLUMN role;
ALTER TABLE materials DROP COLUMN video_source;
DROP TABLE question_banks;

-- Tier 2 (hanya jika setuju hapus endpoint /admin/users/{id}/payment juga)
ALTER TABLE users DROP COLUMN payment_status;
```

> Catatan: `users.role` dan `materials.video_source` tidak ber-index dan tidak di-constraint, jadi `DROP COLUMN` cepat & aman. `question_banks` 0 baris, drop aman. Untuk `payment_status`, hapus dulu handler/repository/service endpoint terkait di Go sebelum drop kolom.

## Files Kunci Referensi

- `backend/internal/models/user.go`
- `backend/internal/models/material.go`
- `backend/internal/models/questionbank_question.go`
- `backend/internal/database/database.go`
- `backend/internal/user/user_repository.go`
- `backend/internal/user/handler.go`
