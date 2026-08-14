# Laporan Audit Kode — Robustness & Keamanan

Tanggal: 2026-08-14
Scope: `web/` (React 19 + TanStack Router) 179 file + `backend/` (Go/Fiber/GORM) 89 file
Metode: review statis manual (baca kode) + scan pola anti-pattern. Aplikasi **tidak dijalankan** (DB/storage tidak tersedia di lingkungan audit) — semua temuan diverifikasi dari source code.

---

## Ringkasan Eksekutif

Kualitas kode secara umum **baik**: error handling backend konsisten, operasi multi-tabel sudah dibungkus transaksi di banyak tempat, tidak ada `console.log`/`TODO` tersisa di kode app, dan fix N1–N3 dari audit sebelumnya sudah terverifikasi benar.

Namun masih ada **1 temuan kritis, 2 temuan tinggi, dan beberapa temuan sedang** yang sebagian besar sudah pernah dilaporkan di `AUDIT_REPORT.md` (2026-08-09) tetapi **belum diperbaiki**, plus beberapa masalah robustness baru yang belum pernah dilaporkan.

| # | Severity | Ringkasan | Status |
|---|----------|-----------|--------|
| 1 | **Kritis** | Stored XSS: konten forum/materi di-render via `innerHTML` tanpa sanitasi | 🔴 Masih terbuka (S1) |
| 2 | — | Admin tidak bisa approve/reject booking — **by design** (hanya guru terkait). Masalah aslinya: UI admin menampilkan tombol "Tolak" yang pasti gagal → **tombol sudah dihapus** | ✅ Clarified & fixed 2026-08-14 |
| 3 | **Tinggi** | Draft & materi milik guru lain bisa dibaca + diubah/dihapus lintas-teacher | ✅ **Fixed 2026-08-14** (S4/A7) — akses per-author di service material |
| 4 | **Tinggi** | Goroutine background job tanpa `recover` → satu panic = seluruh server crash | 🆕 Baru |
| 5 | **Tinggi** | `EvidenceCleanup` non-atomic → bukti bisa "stuck" permanen (broken link) | 🆕 Baru |
| 6 | Sedang | Token sesi di `localStorage` + token OAuth lewat query-string URL (S2) | 🔴 Masih terbuka |
| 7 | Sedang | CORS terbuka penuh + tidak ada rate limiter (S5) | 🔴 Masih terbuka |
| 8 | Sedang | Reject booking **grup** tidak transaksional → bisa reject sebagian | ✅ **Fixed 2026-08-14** (A3) — path `rejected` dibungkus `s.db.Transaction` |
| 9 | Sedang | Fee guru dihitung dinamis → berubah retroaktif saat persen fee diubah | 🆕 Baru |
| 10 | Sedang | Uang (invoice, fee, harga) pakai `float64` | 🆕 Baru |
| 11 | Sedang | Password admin di-log plaintext saat seed server | 🆕 Baru |
| 12 | Sedang | Route `/user/*` masih ada & tidak ter-guard role (F1) | 🔴 Masih terbuka |
| 13 | Rendah | 0 unit test (hanya 1 file test di package `storage`) | 🔴 Masih terbuka (F3) |
| 14 | Rendah | Subscribe: student bisa submit `amount` berapa saja (S9) | 🔴 Masih terbuka |
| 15 | Rendah | Sliding session tanpa absolute expiry (F4) | 🔴 Masih terbuka |
| 16 | Rendah | OAuth `oauth_state` cookie tanpa `SameSite`/`Secure` eksplisit (S6) | 🔴 Masih terbuka |
| 17 | Rendah | List admin tanpa pagination (S8) | 🔴 Masih terbuka |
| 18 | Info | `err: any` di ~60 tempat frontend; `SessionResolver` 4 query/request | 🆕 Baru |

---

## A. Temuan Baru (belum pernah dilaporkan)

### A1. TINGGI — Goroutine background job tanpa `recover` → crash seluruh server

`backend/internal/jobs/jobs.go:72,100` — `StartSessionCleanup()` dan `StartEvidenceCleanup()` meluncurkan `go func()` **tanpa `defer recover()`**.

- Panic apa pun di dalam goroutine (mis. GORM panic, nil pointer, dsb.) akan **mematikan seluruh proses Go** — bukan hanya job-nya.
- Dampak: server down sampai di-restart; job yang di tengah jalan tidak ada retry otomatis.

**Fix saran:** bungkus body tiap loop dengan `defer func() { if r := recover(); r != nil { log.Printf("panic job: %v", r) } }()` + `time.Sleep` lanjut.

---

### A2. TINGGI — `EvidenceCleanup` non-atomic → bukti bisa "stuck" permanen

`backend/internal/jobs/jobs.go:44-68` — urutan: **hapus file MinIO dulu**, lalu `ClearSessionEvidence` (update DB).

- Kalau update DB gagal setelah file terhapus → DB masih menunjuk `evidence_url` ke file yang sudah tidak ada → **broken image**.
- Lebih parah: iterasi berikutnya `objectStorage.Delete` akan error (file sudah hilang) → `continue` → sesi itu **tidak akan pernah di-clear** → stuck selamanya.
- Ini kebalikan dari pola yang sudah diperbaiki di N1–N3 (kompensasi/urut DB-dulu).

**Fix saran:** balik urutannya (clear DB dulu, hapus file sesudahnya — file orphan lebih aman), atau pada error `Delete` yang berarti "not found" anggap sukses lalu lanjut clear DB. Tambahkan juga guard `evidence_url == ""`.

---

### A3. SEDANG — Reject booking grup tidak transaksional — ✅ FIXED (2026-08-14)

Sebelumnya `backend/internal/tutoring/service.go` — path `confirmed` sudah pakai `s.db.Transaction`, tapi path `rejected` **tidak**:

```go
if status == "rejected" {
    for _, b := range targets {   // loop tanpa transaksi
        if b.Status == "pending" {
            if err := s.repo.UpdateBookingStatus(b.ID, "rejected"); err != nil { return nil, err }
        }
    }
}
```

- Booking grup (semua anggota ber-token sama) di-reject satu-per-satu. Kalau update ke-2 gagal → sebagian anggota rejected, sebagian masih pending → state tidak konsisten, dan retry dari user akan error "sudah diproses sebagian".

**Perbaikan:** path `rejected` sekarang membungkus loop-nya dengan `s.db.Transaction` (sama seperti path `confirmed`) — semua anggota grup di-update via `tx`, jadi kalau satu member gagal, tidak ada yang ke-commit separuh.

---

### A4. SEDANG — Fee guru dihitung dinamis → berubah retroaktif

`FeeAmount` **bukan kolom DB** — dihitung on-the-fly dari persen *saat ini*:

- `backend/internal/tutoring/service.go:1193,1286` — `res[i].FeeAmount = s.sessionFee(perSession)`
- `sessionFee` = `price * s.settings.TeacherFeePercent() / 100` (service.go:30-31)

Kalau admin mengubah `teacher_fee_percent` (70% → 80%), **seluruh sesi lama di halaman admin/teacher ikut berubah jumlahnya**. `fee_paid` yang sudah ditandai lunas jadi tidak sinkron dengan nominalnya.

**Fix saran:** snapshot `fee_amount` ke kolom `sessions.fee_amount` saat sesi dibuat (di `createSessionsAndInvoice`), dan persen hanya dipakai untuk sesi baru. Kalau perubahan retroaktif memang disengaja, tambahkan dokumentasi eksplisit.

---

### A5. SEDANG — Uang memakai `float64`

- `backend/internal/models/invoice.go:9` — `Amount float64`
- `backend/internal/models/class.go:11-12` — `GroupPrice`, `ContentPrice float64`
- `FeeAmount float64` di response tutoring (6 tempat)

Operasi pecahan (persen fee 70%, refund parsial, dsb.) dengan `float64` rawan error pembulatan (0.1+0.2 ≠ 0.3). Untuk data pembayaran sebaiknya `int64` (dalam sen) atau tipe Decimal.

**Fix saran:** simpan dalam sen (`int64`), konversi ke Rupiah hanya saat tampil. Setidaknya bulatkan eksplisit saat simpan/display.

---

### A6. SEDANG — Password admin di-log plaintext

`backend/cmd/server/main.go:189`:

```go
log.Printf("Admin seeded: %s / %s\n", cfg.AdminEmail, cfg.AdminPass)
```

Password admin (dari env) tercetak di log server setiap kali akun admin baru di-seed. Log server sering di-share untuk debugging → kredensial admin bocor.

**Fix saran:** log hanya email, atau tampilkan password sekali saja saat interaktif. Jangan cetak password.

---

### A7. SEDANG — S4 diperluas: teacher bisa **menulis** materi milik guru lain — ✅ FIXED (2026-08-14)

Sebelumnya: `material.Service.Update`/`Delete`/`Get`/`List*` tanpa filter `author_id`, dan `AuthorID` **tidak pernah diisi** saat create (seluruh materi lama `author_id = 0`).

**Perbaikan (backend `internal/material`):**
- `Create` sekarang menerima `authorID` dari session (`callerAccess(c).CallerID`) — kolom `author_id` mulai terisi.
- Service punya `Access{CallerID, IsAdmin, IsStaff}` + `canView`/`canManage`:
  - **Baca**: published boleh semua; draft hanya admin, penulisnya, atau materi tanpa pemilik (`author_id=0`). Guru lain → 404.
  - **Tulis** (update/hapus): hanya admin, penulisnya, atau materi tanpa pemilik. Guru lain → 403 `bukan materi kamu`.
  - **List**: non-admin hanya melihat published + miliknya + tanpa pemilik (`ListScoped`/`ListByChapterScoped`).
- **Materi lama (`author_id=0`)** tetap bisa dikelola guru berizin, dan **di-claim otomatis** (jadi milik guru tersebut) saat pertama kali diedit — sesuai keputusan bisnis.
- Handler: `callerAccess(c)` + pemetaan error 403/404; halaman edit frontend menampilkan state error kalau akses ditolak; aksi edit/publish/hapus di UI materi di-gate per kepemilikan (`author_id` ditambahkan ke tipe client).

**✅ Paket soal — FIXED (2026-08-14):** pola yang sama diterapkan ke `questionpackage`/`questionbank`:
- `QuizPackage` + `QuizCollection` dapat kolom `AuthorID` (diisi dari session saat create; data lama `0/NULL` = tanpa pemilik).
- Paket: `List` non-admin hanya published + miliknya + tanpa pemilik; `Get` draft hanya owner/admin/tanpa pemilik; `Update`/`Delete` hanya owner/admin (claim otomatis saat edit paket tanpa pemilik).
- Koleksi: `Update`/`Delete` hanya owner/admin (claim sama); list koleksi tetap shared untuk semua staff (koleksi = bundel per kelas, seperti chapter).
- Soal (`questionbank`): create/update/delete/list soal di-gate ke **kepemilikan paket** — guru tidak bisa menambah/mengubah/menghapus soal di paket milik guru lain.
- Frontend: `author_id` ditambahkan ke tipe client; aksi edit/publish/hapus disembunyikan untuk koleksi/paket milik guru lain (tetap bisa lihat).

---

### A8. INFO — Frontend: `err: any` tersebar ~60 tempat

`onError: (err: any) => toast.error(err?.error || err?.message || ...)` di hampir semua dialog/form. Konsisten, tapi tidak ada tipe error bersama dari API client (lihat `client.gen.ts:214` `// TODO: we probably want to return error and improve types`). Kalau bentuk error API berubah, semua toast kehilangan pesan diam-diam.

**Fix saran:** definisikan tipe `ApiError` di satu tempat (mis. `{ error: string; message?: string }`) dan ganti `any`. Prioritas rendah.

---

### A9. INFO — `SessionResolver` melakukan 4 query DB per request

`backend/internal/middleware/auth.go:47-68` — tiap request terautentikasi:
1. `SELECT session` (validasi token)
2. `SELECT user` (dengan `Preload("Roles")`)
3. `extractRoles` → `SELECT user + roles` lagi (duplikat query role)
4. `UPDATE session SET expires_at` (sliding)

Error pada update sliding diabaikan (ok), tapi 4 query/request untuk setiap halaman dashboard cukup boros. **Fix saran:** reuse `user.Roles` dari preload (hapus `extractRoles` terpisah), dan pertimbangkan perpanjang sesi hanya jika sudah lewat sebagian TTL.

---

## B. Status Temuan Audit Sebelumnya (2026-08-09) — Verifikasi

| # | Temuan lama | Status 2026-08-14 | Bukti |
|---|-------------|-------------------|-------|
| N1 | Upload bukti sebelum ownership divalidasi | ✅ **Fixed** | `ValidateEvidenceUpload` dipanggil sebelum upload; kompensasi `Delete` bila simpan DB gagal |
| N2 | Cover upload non-atomic | ✅ **Fixed** | Update DB dulu, baru hapus file lama |
| N3 | Reject evidence: DB dulu, file belakangan | ✅ **Fixed** | Hapus file dulu (error dicek), lalu update DB |
| S1 | Stored XSS via `innerHTML` | 🔴 **Masih terbuka** | `rich-content.tsx:16` masih `ref.current.innerHTML = html;`; backend hanya `stripHTML` (regex) untuk preview + normalisasi URL gambar, tanpa sanitasi whitelist |
| S2 | Token localStorage + URL query-string | 🔴 **Masih terbuka** | `main.tsx:10`, `auth.callback.tsx:16`, `oauth.go:113` (redirect `?token=`) |
| S3 | Admin tidak bisa reject/confirm booking | ✅ **Bukan bug — by design** (klarisifikasi 2026-08-14) | Hanya guru terkait yang boleh approve/reject (`tutoring/service.go:712`). Yang bermasalah justru UI-nya: tombol "Tolak" di `admin/tutoring/index.tsx` muncul untuk booking pending tanpa guru — endpoint-nya teacher-only sehingga **selalu gagal**. Tombol + mutation mati sudah dihapus dari UI admin |
| S4 | Draft materi bocor via admin endpoint | ✅ **Fixed 2026-08-14** | Akses per-author di service material (lihat A7) |
| S5 | CORS `*` + tanpa rate limiter | 🔴 **Masih terbuka** | `main.go:70` `app.Use(cors.New())`; tidak ada import limiter |
| S6 | OAuth `state` cookie tanpa SameSite | 🔴 **Masih terbuka** | `oauth.go:53-59` — `HTTPOnly` saja, tanpa `SameSite`/`Secure` eksplisit |
| S7 | Dev-reset di `.env` | ⚠️ Tergantung env produksi | `DEV_RESET_ENABLED` — pastikan off di produksi |
| S8 | List admin tanpa pagination | 🔴 **Masih terbuka** | `AdminListUsers`, `AdminListInvoices`, dan `getAdminTutoringEvidenceOptions` (fetch semua + filter di client) |
| S9 | Subscribe amount bebas | 🔴 **Masih terbuka** | `invoice/service.go:62` hanya `if input.Amount <= 0` |
| F1 | Route `/user/*` tidak ter-guard | 🔴 **Masih terbuka** | 4 file: `_dashboard/user/{dashboard,materials,$materialId,subscribe}.tsx`; `requiredRoleForPath` (`role.ts:13-18`) tidak mencakup `/user/` |
| F2 | Endpoint booking/availability admin tumpang-tindih teacher | ⚠️ Sebagian | Masih ada cabang role di `ListAvailability`/`ListBookings`, tapi data admin ada di `/admin/tutoring/*` |
| F3 | 0 unit test | 🔴 **Hampir masih** | Bertambah 1 file: `storage/content_images_test.go` (berjalan OK via `go test ./...`). Semua package lain 0 test |
| F4 | Sliding session tanpa absolute expiry | 🔴 **Masih terbuka** | `middleware/auth.go:62-63` perpanjang tiap request; `SessionTTL` tanpa batas maksimal |
| F5 | Dua implementasi `stripHTML` duplikat | 🔴 **Masih terbuka** | `forum/service.go:17`, `answer/service.go:17` — regex sama di-dup |

---

## C. Catatan Kecil (housekeeping)

1. `backend/cmd/server/main.go:97` — ada karakter tab sebelum `tutoring.Routes(...)` (formatting, bukan bug).
2. `setting/service.go:28-33` — `EnsureDefaults` mengabaikan error `s.repo.Set(...)`; juga `DeleteStale(AllowedKeys)` menghapus semua key yang tidak dikenal — kalau suatu hari ada key lama yang masih dipakai kode lain, ikut terhapus. Validasi di `Update` sudah benar (validasi semua dulu, baru tulis).
3. Halaman attendance `$userId.tsx` — fetch **semua** users + evidence + report lalu filter di client (`users.find(...)`, `sessions.filter(...)`). Bekerja di skala kecil, tidak scalable (sama dengan S8).
4. `_dashboard.tsx` — guard role + komponen command palette sudah rapi; tidak ada temuan.

---

## D. Rekomendasi Prioritas

**Segera (1-2 hari):**
1. **A1 + A2** — `recover` di goroutine jobs & perbaiki urutan `EvidenceCleanup` (crash server & data stuck adalah yang paling menyakitkan di produksi).
2. **#2 (S3)** — bypass admin di `UpdateBookingStatus` (tombol Tolak admin saat ini selalu error).

**Minggu ini:**
3. **#3 (S4/A7)** — scope `author_id` di service material (baca + tulis).
4. **#1 (S1)** — sanitasi HTML (bluemonday di backend, atau DOMPurify di `rich-content` sebelum `innerHTML`).
5. **A3** — transaksi untuk reject booking grup.

**Berikutnya:**
6. **A4** — snapshot `fee_amount` saat sesi dibuat.
7. **#6 (S2)** — pindah token dari localStorage/URL ke cookie `HttpOnly` (minimal `sessionStorage`).
8. **A5/A6** — money ke int sen; jangan log password admin.
9. **#12 (F1)** — hapus route `/user/*` atau redirect ke `/student/*`.
10. **#13 (F3)** — tambah test minimal: `middleware.RoleAllowed`, `invoice.ToggleStatus`, `tutoring` booking/session flow, `setting` fee validation.
