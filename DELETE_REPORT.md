# Laporan Proses Penghapusan Data — Soft Delete vs Hard Delete

Tanggal: 2026-08-14
Scope: `backend/` (Go / Fiber / GORM / PostgreSQL)
Metode: review statis manual atas seluruh operasi `Delete`/`Unscoped` di source code. Aplikasi **tidak dijalankan** — semua temuan diverifikasi dari kode.

---

## Ringkasan Eksekutif

- **Semua 25 model** di `backend/internal/models/` meng-embed `gorm.Model`, artinya **setiap tabel punya kolom `deleted_at`** dan secara teknis mendukung soft delete.
- Meski begitu, **operasi hapusnya tidak seragam**:
  - Sebagian operasi memakai **soft delete** (GORM default `db.Delete(...)` → set `deleted_at`).
  - Sebagian besar operasi memakai **hard delete** (`db.Unscoped().Delete(...)` → baris dihapus permanen), hampir selalu sebagai *cascade* dalam satu transaksi.
  - Ada 1 pola **purge**: saat migrasi, baris yang sudah soft-deleted di 3 tabel di-hard-delete (karena bentrok unique index `slug`).
- Kebijakan de facto:
  - **Master data konten** (kelas, chapter, subject, materi, invoice, paket/soal, koleksi) → **hard delete** + cascade transaksional.
  - **Data relasional "ringan"** (program, akses kelas, jawaban forum, push subscription, setting) → **soft delete**.
  - **User** → **soft delete untuk teacher** (kebijakan belum final), **hard delete untuk non-teacher** beserta seluruh data yang merujuknya.
- 1 temuan penting: `cmd/delete_user/main.go` (tool manual, bukan API) melakukan cleanup **tanpa transaksi**, dan komentarnya menyebut bug `hardDeleteTx` yang memakai `Pluck` tanpa `Unscoped` sehingga baris soft-deleted bisa membuat FK memblokir penghapusan.

---

## 1. Model & Kemampuan Soft Delete

Semua model di bawah embed `gorm.Model` → kolom `id`, `created_at`, `updated_at`, `deleted_at` otomatis ada:

| # | Model | Tabel | File model |
|---|-------|-------|-----------|
| 1 | User | `users` | user.go |
| 2 | Session | `sessions` | session.go |
| 3 | Class | `classes` | class.go |
| 4 | Subject | `subjects` | subject.go |
| 5 | ClassSubject | `class_subjects` | class_subject.go |
| 6 | Chapter | `chapters` | chapter.go |
| 7 | Material | `materials` | material.go |
| 8 | ForumQuestion | `forum_questions` | question.go |
| 9 | ForumAnswer | `forum_answers` | answer.go |
| 10 | ForumQuestionImage | `forum_question_images` | question_image.go |
| 11 | SubjectImage | `subject_images` | subject_image.go |
| 12 | Invoice | `invoices` | invoice.go |
| 13 | Booking | `bookings` | booking.go |
| 14 | TutoringSession | `tutoring_sessions` | tutoring_session.go |
| 15 | Role | `roles` | role.go |
| 16 | QuizQuestion | `quiz_questions` | questionbank_question.go |
| 17 | QuizAnswer | `quiz_answers` | questionbank_answer.go |
| 18 | QuizCollection | `quiz_collections` | question_package_collection.go |
| 19 | QuizPackage | `quiz_packages` | question_package.go |
| 20 | TeacherSubject | `teacher_subjects` | teacher_subject.go |
| 21 | PushSubscription | `push_subscriptions` | push_subscription.go |
| 22 | Program | `programs` | program.go |
| 23 | StudentClass | `student_classes` | student_class.go |
| 24 | Setting | `settings` | setting.go |
| 25 | QuizStudentProgress | `quiz_student_progresses` | student_question_progress.go |

Catatan khusus: `QuizStudentProgress` **memakai soft delete sebagai fitur** — `DeletedAt` = "reset progress" (student mau mengulang). Saat student mengerjakan ulang, `SaveProgress` (questionpackage/repository.go:106) **me-restore `deleted_at = nil`** (repository.go:114) alih-alih insert baru.

---

## 2. Inventaris Operasi Delete per Tabel

| Tabel | Tipe | Lokasi (file:baris) | Kapan dipanggil |
|-------|------|---------------------|-----------------|
| `users` | Soft (teacher) / Hard (non-teacher) | user_repository.go:100 / user_repository.go:196 | AdminDeleteUser; tool `delete_user` |
| `sessions` | Soft (logout) / Hard (expired, hapus user) | session_repository.go:32,36 (soft); :46 (hard) | logout; background job `SessionCleanup`; hapus user |
| `classes` | Hard | class/repository.go:42 | AdminDeleteClass |
| `chapters` | Hard | chapter/repository.go:92 | AdminDeleteChapter |
| `subjects` | Hard (+ cascade `class_subjects`) | subject/repository.go:102,105 | AdminDeleteSubject |
| `class_subjects` | Hard (replace) | subject/repository.go:86 (`setClassesTx`) | simpan relasi subject↔kelas |
| `materials` | Hard | material/repository.go:100; user_repository.go:191 | AdminDeleteMaterial; hapus user |
| `forum_questions` | Hard (cascade) | forum/repository.go:78 (`DeleteHard`) | hapus pertanyaan (user/admin) |
| `forum_answers` | Soft (hapus sendiri) / Hard (cascade) | answer/repository.go:43 (soft); forum/repository.go:72 (hard) | hapus jawaban; hapus pertanyaan |
| `forum_question_images` | Hard (cascade) | forum/repository.go:75 | hapus pertanyaan |
| `subject_images` | Soft (gallery) / Hard (hapus user) | gallery/handler.go:407 (soft); user_repository.go:131 (hard) | hapus gambar; hapus user |
| `invoices` | Hard (admin) / Soft (cancel pending) / Hard (hapus user) | invoice/repository.go:56 (hard); tutoring/service.go:820 (soft); user_repository.go:139,154 (hard) | AdminDeleteInvoice; CancelBooking; hapus user |
| `bookings` | Soft (DeleteBookingCascade) / Hard (hapus user) | tutoring/repository.go:204 (soft); user_repository.go:158 (hard) | AdminDeleteBooking; hapus user |
| `tutoring_sessions` | Soft (DeleteBookingCascade) / Hard (hapus user) | tutoring/repository.go:198 (soft); user_repository.go:151 (hard) | AdminDeleteBooking; hapus user |
| `roles` | Soft | database.go:148 | migrasi hapus role `"user"` |
| `quiz_questions` | Hard | questionbank/repository.go:96; questionpackage/repository.go:83 | hapus soal; hapus paket |
| `quiz_answers` | Soft (replace) / Hard (cascade) | questionbank/repository.go:66 (soft); questionpackage/repository.go:79 (hard) | simpan ulang jawaban soal; hapus paket |
| `quiz_packages` | Hard | questionpackage/repository.go:86 | hapus paket |
| `quiz_collections` | Hard | questionpackage/repository.go:230 | hapus koleksi |
| `teacher_subjects` | Hard (replace & hapus user) | user_repository.go:253 (`SetTeacherSubjects`); :127 (hapus user) | set mapel guru; hapus user |
| `push_subscriptions` | Soft (404/410) / Hard (hapus user) | push/service.go:95 (soft); user_repository.go:135 (hard) | push subscription invalid; hapus user |
| `programs` | Soft | program/repository.go:58 | AdminDeleteProgram |
| `student_classes` | Soft | studentclass/repository.go:45; :51 (`Upsert`) | revoke akses kelas; ganti akses |
| `settings` | Soft | setting/repository.go:53 (`DeleteStale`) | prune key setting tidak dikenal |
| `quiz_student_progresses` | Soft (by design = reset) | (model comment); restore di questionpackage/repository.go:107 | reset/ulangi pengerjaan |

---

## 3. Pola Soft Delete (kapan & kenapa)

Operasi soft delete dipakai saat data **masih perlu "ada" secara historis atau mudah dipulihkan**, atau saat data tersebut adalah *hubungan* yang sering diganti:

1. **Program** (`program/repository.go:58`) — admin hapus program; data historis tetap bisa ditelusuri.
2. **Akses kelas / student** (`studentclass/repository.go:45,51`) — revoke akses; pola `Upsert` = soft-delete lama + insert baru.
3. **Jawaban forum** (`answer/repository.go:43`) — student hapus jawabannya sendiri.
4. **Push subscription** (`push/service.go:95`) — hapus subscription yang merespons 404/410 (tidak valid).
5. **Setting** (`setting/repository.go:53`) — `DeleteStale` menghapus key yang tidak dikenal.
6. **Role** (`database.go:148`) — migrasi menghapus role lama `"user"`.
7. **Gambar gallery** (`gallery/handler.go:407`) — hapus `subject_images` (soft).
8. **Sesi login** (`session_repository.go:32,36`) — logout: hapus token sesi (soft). **Catatan**: cleanup sesi kedaluwarsa justru hard (`Unscoped`).
9. **Booking & turunannya (admin)** (`tutoring/repository.go:198-204`) — `DeleteBookingCascade`: sesi + invoice + booking di-soft-delete dalam satu transaksi.
10. **Invoice pending saat cancel booking** (`tutoring/service.go:820`) — di-soft-delete dalam transaksi.
11. **Jawaban soal saat replace** (`questionbank/repository.go:66`) — `replaceAnswersTx` soft-delete jawaban lama, lalu insert baru (bukan update).
12. **QuizStudentProgress** — soft delete = fitur reset progress (restore `deleted_at` saat mengerjakan ulang).

---

## 4. Pola Hard Delete (kapan & kenapa)

Operasi hard delete dipakai untuk **master data konten** dan **privasi/komplians data user**. Hampir semua dilakukan sebagai *cascade* dalam satu transaksi:

1. **Class, Chapter, Subject** — `Unscoped().Delete` (class/repository.go:42, chapter/repository.go:92, subject/repository.go:105). Subject juga menghapus relasi `class_subjects`-nya (subject/repository.go:102).
2. **Material** — `material/repository.go:100`.
3. **Invoice (admin)** — `invoice/repository.go:56`.
4. **Paket soal, soal, koleksi** — cascade `quiz_answers` → `quiz_questions` → `quiz_packages` (questionpackage/repository.go:79-86); `quiz_collections` (repository.go:230); hapus soal tunggal dengan `Select(clause.Associations)` (questionbank/repository.go:96).
5. **Pertanyaan forum** — `DeleteHard` (forum/repository.go:61-78): kumpulkan nama file gambar dulu, hapus jawaban → gambar → pertanyaan, lalu caller membersihkan object storage **setelah commit**.
6. **User non-teacher** — `hardDeleteTx` (user_repository.go:109-197): hapus **semua** data yang merujuk user (sesi, pivot roles, mapel, gambar, push, invoice, booking+sessions+invoices-nya, pertanyaan forum + gambar + jawaban, jawaban di forum orang lain, bank soal + jawaban, materi) lalu user-nya. Satu transaksi besar.
7. **Replace pattern** — `setClassesTx` (subject/repository.go:86) dan `SetTeacherSubjects` (user_repository.go:253): hapus hard relasi lama, insert baru (transaksional).
8. **Purge saat migrasi** — `database.go:178-180`: `Unscoped().Where("deleted_at IS NOT NULL").Delete(...)` untuk chapters, subjects, materials — membersihkan baris soft-deleted lama yang akan **bentrok dengan unique index `slug`**.

---

## 5. Pola Purge (migrasi)

`backend/internal/database/database.go:178-180`:

```go
// hard-delete soft-deleted rows to avoid slug unique constraint conflicts
db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Chapter{})
db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Subject{})
db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Material{})
```

Ini konsekuensi dari **unique index `slug` yang tidak partial**. Kalau `chapter`/`subject`/`material` di-soft-delete lalu dibuat ulang dengan slug sama, insert akan bentrok. Solusi yang dipakai: hard-delete baris soft-deleted saat migrasi. (Bandingkan: `settings.key` memakai **partial unique index** `where:deleted_at IS NULL` — setting.go:8 — pola yang benar sehingga aman di-soft-delete.)

---

## 6. Dev Reset (bukan soft/hard delete biasa)

`backend/internal/devreset/handler.go` (fitur dev, di-guard `DEV_RESET_ENABLED`):
- `resetNormal`: raw SQL `DELETE FROM "<table>"` (hard) dengan `DISABLE TRIGGER ALL` dulu (agar cek FK tidak memblokir), lalu `setval` reset sequence id.
- `resetUsers`: dalam transaksi — hapus `user_roles` + `sessions` + `users` (kecuali admin) + reset sequence.
- Tabel tertentu di-*protected* (tidak bisa di-reset).

---

## 7. Transaksi & Atomisitas

| Operasi | Transaksi? | Catatan |
|---------|-----------|---------|
| `hardDeleteTx` (hapus user) | ✅ Ya (1 transaksi besar) | Gagal di tengah → semua batal |
| `Merge` (gabung akun) | ✅ Ya | Pindah data + hapus akun dummy atomic |
| `forum DeleteHard` | ✅ Ya | Nama file dikumpulkan **sebelum** delete; storage dibersihkan setelah commit |
| `questionpackage Delete` | ✅ Ya | Jawaban → soal → paket |
| `subject Delete` / `setClassesTx` | ✅ Ya | Relasi + entity |
| `SetTeacherSubjects` | ✅ Ya | Replace pattern |
| `tutoring DeleteBookingCascade` | ✅ Ya | Sesi + invoice + booking (soft) |
| `CancelBooking` | ✅ Ya | Hapus invoice pending (soft) |
| `studentclass Upsert` | ✅ Ya | Delete lama + create baru |
| `cleanupUser` di `cmd/delete_user/main.go` | ❌ **Tidak** | Tool manual; kalau crash di tengah → state parsial |

---

## 8. Temuan & Risiko

1. **Kebijakan soft/hard tidak terdokumentasi & tidak seragam** — semua tabel punya `deleted_at`, tapi mayoritas operasi justru hard delete. Tidak ada dokumen yang menyatakan per entity mana yang harus soft dan mana yang hard. Risiko: developer baru salah pilih pola, data hilang permanen yang seharusnya bisa dipulihkan.

2. **Unique index `slug` vs soft delete** — `chapters`/`subjects`/`materials` soft-deleted tetap menempati nilai slug di unique index → conflict saat insert ulang → makanya ada purge di migrasi. Fix yang benar: partial unique index (`WHERE deleted_at IS NULL`), seperti yang sudah dipakai `settings.key`.

3. **`cmd/delete_user/main.go` cleanup tanpa transaksi** — tool ini menghapus data user secara manual di luar repository, tanpa `db.Transaction`. Komentar di file itu (baris 51-52) juga mengakui bug: `UserRepository.hardDeleteTx` memakai `Pluck` **tanpa `Unscoped`** untuk `ForumQuestion` (user_repository.go:163) dan `QuizQuestion` (user_repository.go:181), sehingga pertanyaan/soal yang sudah soft-deleted **tidak ikut ter-pluck** → anaknya (gambar/jawaban) tidak terhapus → FK memblokir hapus parent. Tool ini menambal dengan `cleanupUser` yang `Unscoped`, tapi bypass tersebut tidak transaksional.

4. **Gallery delete: file storage dihapus dulu, baru DB** — `gallery/handler.go:404-407`: kalau `h.db.Delete(&img)` gagal setelah file terhapus, DB masih mereferensikan file yang sudah tidak ada → **broken image**. Ini arah yang berlawanan dengan pola "DB dulu, file belakangan" yang sudah diterapkan di A2 (`EvidenceCleanup`) dan N2 (cover upload).

5. **Session: logout soft, expired hard** — logout memakai soft delete (`session_repository.go:32`), sementara `DeleteExpired` hard (`:46`). Tidak berbahaya (soft-deleted sesi tidak pernah di-query), tapi dua arah untuk satu tabel — layak diseragamkan.

6. **Invoice dihapus 2 jalur saat hapus user** — `hardDeleteTx` menghapus invoice milik user langsung (`:139`) dan lagi per-booking (`:154`). Idempotent, tidak bermasalah — hanya redundan.

---

## 9. Rekomendasi

1. **Dokumentasikan kebijakan per entity** — buat matriks resmi (seperti tabel di seksi 2) yang menyatakan: master data → hard delete + cascade transaksional; data relasional/riwayat → soft delete; user → soft (teacher) / hard (non-teacher). Tempel matriks ini di `README` atau komentar package.
2. **Ganti unique index `slug` menjadi partial** (`WHERE deleted_at IS NULL`) untuk `chapters`/`subjects`/`materials`, lalu hapus purge di `database.go:178-180`.
3. **Perbaiki `hardDeleteTx`**: tambahkan `.Unscoped()` pada `Pluck` `ForumQuestion` dan `QuizQuestion` (user_repository.go:163,181) sehingga baris soft-deleted ikut ter-cleanup; setelah itu `cmd/delete_user/main.go` bisa memakai repository saja.
4. **Bungkus `cleanupUser` di `delete_user/main.go` dengan transaksi** (atau hapus dan serahkan ke `UserRepository.Delete` yang sudah transaksional).
5. **Gallery**: balik urutan hapus (DB dulu, file belakangan) atau kompensasi restore — ikuti pola yang sudah dipakai di A2/N2.
6. **Seragamkan session delete** — logout cukup hard delete (baris sesi tidak perlu riwayat).
