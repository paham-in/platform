# Audit Fitur Materi & Paket Soal — Hak Akses per Role

Tanggal: 2026-09-07 · Scope: `backend/internal/material`, `chapter`, `questionpackage`, `questionbank`, `middleware`, + permukaan frontend terkait.

> Catatan: `internal/answer` BUKAN jawaban quiz — itu forum Tanya-Jawab (`ForumAnswer`). Jawaban quiz adalah `QuizAnswer` di `questionbank`/`questionpackage`.

## 1. Ringkasan eksekutif

| Pertanyaan audit | Jawaban singkat |
|---|---|
| Admin bisa CRUD semua? | Ya, bypass total di semua modul. |
| Guru bisa CRUD? | Baca bebas; **tulis hanya bila flag izinnya menyala** (`can_manage_materials` / `can_manage_question_packages`, default `false`, di-set admin). Edit/hapus materi & paket **hanya milik sendiri** (`AuthorID`); chapter **tanpa konsep owner** — guru berizin bisa ubah chapter siapa pun. |
| Murid non-langganan bisa akses konten? | Hanya konten **free + published**. Konten berbayar digate langganan aktif (`student_class_enrollments`, `expiry >= hari ini`). |
| Murid bisa intip draft? | Tidak (list maupun detail menyaring `published`; draft guru lain disamarkan 404). |
| Endpoint tanpa auth? | **Tidak ditemukan** untuk materi/quiz. Semua butuh `Bearer` valid. |
| Temuan paling serius | **Kritis (1):** `GET .../work/progress` membocorkan kunci jawaban **seluruh** soal paket termasuk yang belum dikerjakan. **Tinggi (2):** murid tanpa langganan bisa list **semua chapter** (fail-open); submit jawaban bisa diulang tak terbatas dengan kunci langsung dikembalikan (brute-force nilai). |

## 2. Cara kerja gate akses (fondasi bersama)

### 2.1 Stack middleware & grup route (`cmd/server/main.go`, `middleware/auth.go`)

| Grup | Syarat | Dipakai oleh |
|---|---|---|
| `auth` (`main.go:94`) | Login (`SessionRequired` + `SessionResolver`, sliding expiry) | Endpoint murid: `GET /materials`, `/chapters`, `/question-packages*` |
| `staff` = `/admin` (`main.go:110`) | Login + role `admin`/`teacher` | Semua kelola konten |
| `content` (`main.go:116`) | `staff` + `ContentManager(db,"materials")` | Materi + chapter |
| `packs` (`main.go:124`) | `staff` + `ContentManager(db,"question_packages")` | Paket soal + koleksi + bank soal |
| `admin` murni (`main.go:128`) | Login + role `admin` | Tidak ada route materi/quiz di sini |

`ContentManager` (`middleware/auth.go:104-136`): admin selalu lolos; **`GET/HEAD` selalu lolos untuk guru** (disengaja — guru perlu buka konten saat mengajar walau tanpa izin kelola); `POST/PATCH/DELETE` oleh guru wajib flag izin sesuai resource.

### 2.2 Flag izin guru (`models/teacher_permission.go:7-12`, migrasi `000008_teacher_permissions`)

- `can_manage_materials` → tulis materi + chapter + upload cover.
- `can_manage_question_packages` → tulis paket + koleksi + soal.
- Default `false`; admin mengaturnya lewat halaman `admin/teacher-permissions.tsx` → dialog `teacher-permissions-dialog.tsx`.

### 2.3 Sumber kebenaran langganan

Tabel `student_class_enrollments` (`models/student_class.go`, migrasi `000028_...`): `user_id`, `class_id`, `expiry "YYYY-MM-DD"`. Dibuat manual oleh admin (dialog `grant-class-dialog.tsx`) atau otomatis saat invoice ber-`class_id` dilunasi (`invoice/service.go:140-170`, perpanjangan = expiry lama + durasi). Valid = `expiry >= hari ini` + belum soft-delete. Tidak ada kolom status — murni tanggal.

Helper (`middleware/access.go`):
- `AccessibleClassIDs` — admin/teacher → `nil` (semua); murid → pluck `class_id` enrollment aktif. **Error DB → `nil`** (fail-open, relevan temuan M1).
- `CanAccessClass` — cek satu kelas; error DB → `false` (fail-closed, benar).
- `CanAccessPremium` — punya ≥1 enrollment aktif?
- `scopeClassIDs` (`questionpackage/handler.go:51-65`) — menormalkan `nil`→`[]` agar murid tanpa enrollment fail-closed ke free-only. Konvensi `nil` = staff, `[]` = murid tanpa akses dipakai konsisten di service/repo quiz.

## 3. Modul Materi & Chapter

### 3.1 Endpoint

| Method + Path | Grup | Efektif untuk |
|---|---|---|
| `GET /admin/materials`, `GET /admin/materials/:id` | `content` | admin semua; guru scoped (published + draft milik sendiri/tanpa pemilik) |
| `POST /admin/materials` | `content` | admin; guru wajib `can_manage_materials`, `AuthorID` = dirinya |
| `PATCH/DELETE /admin/materials/:id` | `content` | admin apa pun; guru hanya milik sendiri/tanpa pemilik (403 `ErrNotOwner` bila bukan) |
| `GET /materials`, `GET /materials?chapter_id=` | `auth` | semua role login; murid: hanya published, paid digate langganan |
| `GET /materials/:id` | `auth` | murid: published + (`is_free` ATAU `CanAccessClass`); draft → 404 |
| `GET /admin/chapters`, `GET /admin/chapters/:id` | `content` | admin & guru (GET bypass, tanpa scope) |
| `POST/PATCH/DELETE /admin/chapters`, `POST /admin/chapters/:id/cover` | `content` | admin; guru wajib `can_manage_materials` — **tanpa cek owner** (chapter tak punya `AuthorID`) |
| `GET /chapters` | `auth` | murid di-scope langganan (**dengan cacat M1**); admin/guru semua |

Fungsi `PublicRoutes` di `material/handler.go:277-284` namanya menyesatkan — dipasang di grup `auth`, jadi tetap butuh login.

### 3.2 Matriks hak akses materi/chapter

| Aksi | Admin | Guru + izin | Guru tanpa izin | Murid (login) |
|---|---|---|---|---|
| List/detail kelola (`/admin/*`, GET) | semua | scoped milik sendiri | sama (GET bypass) | 403 |
| Create materi | ya | ya (`AuthorID` = sendiri) | 403 | 403 |
| Update/delete materi | apa pun | hanya milik sendiri | 403 | 403 |
| Create/update/delete chapter + cover | apa pun | **chapter siapa pun** | 403 | 403 |
| Baca konten (`/materials`, `/chapters`, GET) | semua published | semua published + draft sendiri | sama | published; paid hanya kelas langganan; free semua kelas |

### 3.3 Halaman frontend

- Guru (+ admin, tak ada halaman admin khusus — admin memakai halaman guru): `teacher/chapters/*` (CRUD chapter+materi, pakai endpoint `/admin/*`), `teacher/packs/*` untuk soal.
- Murid: `student/materials/*` (memakai `GET /chapters`, `GET /materials`); role `user` polos: `user/materials*`.
- Langganan: `student/subscribe.tsx` / `user/subscribe.tsx` (beli), `admin/subscriptions/*` (kelola admin).

## 4. Modul Paket Soal / Quiz

### 4.1 Endpoint (dual-ID: admin pakai numeric `id`, murid pakai `public_id` UUID)

Kelola (grup `packs`): `GET/POST /admin/question-packages`, `GET/PATCH/DELETE /admin/question-packages/:id`, `GET/POST/PATCH/DELETE /admin/question-package-collections[*]`, `GET/POST /admin/question-packages/:id/questions`, `PATCH/DELETE .../questions/:qid`. GET lolos tanpa izin tulis; tulis wajib `can_manage_question_packages`.

Murid (grup `auth`, semua role login — gate murni langganan): `GET /question-packages`, `GET /question-packages/:public_id`, `GET /question-package-collections[*]`, `GET .../work/questions` (soal tanpa kunci), `POST .../work/submit` (jawab per soal, kunci langsung dikembalikan), `GET .../work/progress`.

### 4.2 Matriks hak akses paket soal

| Aksi | Admin | Guru + izin | Guru tanpa izin | Murid |
|---|---|---|---|---|
| List/detail kelola (GET) | semua | scoped (published + draft sendiri) | sama (GET bypass, **termasuk kunci jawaban + pembahasan paket published**) | 403 |
| Create/update/delete paket & koleksi & soal | apa pun | hanya milik sendiri (`AuthorID`, soal ikut paket induk; claim `author_id=0` saat edit pertama) | 403 | 403 |
| Lihat & kerjakan paket | bisa (tanpa batas role, ikut mengotori progress — temuan Q9) | sama | sama | hanya paket published **berkoleksi**, koleksi free ATAU kelas langganan |

### 4.3 Alur murid mengerjakan (stateless, per soal — tanpa attempt/timer/batas percobaan)

1. List → buka paket → ambil soal (`work/questions`, tanpa `is_correct`).
2. `work/submit {question_id, answer_id}` → server hitung `is_correct`, upsert progress, **langsung kembalikan `{is_correct, explanation, correct_answer_ids}`**.
3. `work/progress` → `completed_ids`, `selected_answers`, `explanations`, `is_correct`, `correct_answer_ids`.
4. Progress terisolasi per user (`user_id` dari session); tidak ada endpoint intip progress orang lain; tidak ada skor agregat (FE menghitung dari progress).

## 5. Gate langganan murid — hanya yang berlangganan bisa akses (verifikasi)

- **Materi list** (`material/handler.go:224-225` → `repository.go:108-120`): `status='published'` selalu; tanpa enrollment (`includePremium=false`) → `AND is_free=true`; dengan enrollment → `is_free=true OR chapter kelas langganan`. Materi free lintas kelas tetap terlihat — disengaja.
- **Materi detail** (`handler.go:264-272`): gate kedua `!IsFree && !CanAccessClass → 403`. `ClassID` dari `Preload("Chapter")` — aman.
- **Chapter list** (`chapter/handler.go:210-233` → `repository.go:104-110`): chapter kelas langganan + chapter yang punya ≥1 materi free-published. **Tapi gagal total bila murid tak punya enrollment (temuan M1).**
- **Paket list** (`repository.go:57-68`): `collection_id IS NOT NULL AND status=published` + subquery koleksi free/kelas langganan; paket tanpa koleksi & draft tak pernah keluar.
- **Paket detail/kerja** (`service.go:400-425`): tolak tanpa koleksi, tolak draft, koleksi premium wajib `class_id ∈ enrollment`.
- **Koleksi detail**: repo tak filter akses (`repository.go:223-237`) — gate hanya di handler (`handler.go:372-383`); aman hari ini, rapuh bila dipakai ulang.
- Respons murid tidak memuat kunci (`PackageResponse.Questions` hanya `{id, question}`; `WorkQuestions` tanpa `is_correct`) — kecuali temuan kritis Q1.

## 6. Temuan

### Kritis

- **Q1 — `work/progress` membocorkan kunci semua soal.** ✅ **SUDAH DIPERBAIKI (2026-09-07).** `GetProgressDetail` membangun `correctMap` dari **seluruh** soal paket (`questionpackage/service.go:529-541`) dan mengembalikannya utuh (`service.go:551`, `handler.go:518-530`). Murid cukup panggil sekali untuk dapat kunci tanpa mengerjakan apa pun. (`explanations`/`is_correct` hanya untuk soal selesai — hanya `correctAnswerIDs` yang bocor.) Perbaikan: `correctMap` kini disaring ke soal yang sudah ada di progress (`completed` set di `service.go`), sehingga kunci hanya terungkap untuk soal yang sudah dijawab.

### Tinggi

- **M1 — Murid tanpa langganan melihat SEMUA chapter (fail-open).** `ListChapters` (`chapter/handler.go:211-221`) hanya menimpa `classIDs` bila role `student`; tanpa enrollment / DB error hasilnya tetap `nil`, dan `Service.ListFiltered` (`chapter/service.go:77-81`) mengartikan `nil` = staff/semua. List materi fail-closed, chapter tidak. Perbaikan: bedakan `nil` (staff) vs slice kosong (murid tanpa akses).
- **Q2 — Submit bisa brute-force.** Tiap submit langsung mengembalikan kunci + pembahasan (`service.go:489-511`) lalu progress di-overwrite (upsert, `repository.go:114-136`) — submit asal → dapat kunci → submit ulang benar, tanpa batas percobaan/timer/penguncian. Nilai `is_correct` tidak bermakna.

### Sedang

- **M2 — `material_count` menghitung draft** (`chapter/repository.go:138-143` tanpa filter status). Murid melihat count > 0 tapi list kosong — bocor metadata + inkonsistensi UI.
- **M3 — Role `user` polos melihat semua chapter** (hanya role `student` di-scope, `handler.go:214-220`). Punya role student justru lebih dibatasi daripada tidak punya; judul/deskripsi chapter premium terekspos.
- **M4 — Chapter tak punya owner + izin digabung flag materi** (`main.go:116-121`, `auth.go:124-128`). Satu flag `can_manage_materials` membuka tulis ke seluruh chapter + cover siapa pun.
- **Q3 — `quiz_packages.is_free` kolom mati.** Tak pernah diisi (`CreateInput` tak punya fieldnya) dan gate selalu baca `Collection.IsFree` — FE yang baca `package.is_free` (selalu `true`) tertipu.
- **Q4 — `SubmitAnswer` tak validasi `answer_id` milik `question_id`.** Jawaban soal lain dinilai salah tapi tetap tersimpan sebagai `selected_answer_id`.
- **Q5 — `Update/DeleteQuestion` mengabaikan `:id` paket di path** (`handler.go:129,169`) — otorisasi pakai paket aktual soal. Aman fungsional, menipu dan menyulitkan audit.
- **Q6 — Guru bisa tempel/pindah paket ke koleksi guru lain** (create/update tak cek kepemilikan `CollectionID`/`ClassID` target).

### Rendah / info

- **Oracle 403-vs-404**: di luar hak → 403, tak ada → 404 (materi paid & paket murid). Probing ID mengonfirmasi keberadaan. Admin `Get` paket menyamarkan sebagai 404 — jalur murid tidak.
- **Q9**: endpoint kerja terbuka untuk guru/admin (tanpa `RoleAllowed`) — bisa mengotori `quiz_student_progresses`; tidak ada "mode preview".
- **Cover chapter**: validasi hanya header `Content-Type` (bisa dipalsu); hapus chapter hard-delete tanpa bersih-bersih file cover; hapus chapter berisi materi gagal 500 (tanpa cascade).
- **Validasi longgar**: `status`/`type` string bebas (typo = hilang dari list tanpa pesan); slug tanpa deduplikasi (judul kembar → 500, bukan 409); FK tak-ada → 500 generik; materi bisa dipindah ke chapter guru lain tanpa validasi ulang.
- **Materi `DELETE` hard-delete tanpa audit log**; list mengembalikan `content` penuh per item (boros + permukaan scraping).
- **Baik**: tidak ada endpoint quiz/materi tanpa auth; `Get` bank soal internal tanpa cek akses belum terekspos handler (jangan ekspos tanpa `canViewPackage`).

## 7. Rekomendasi (urut prioritas)

1. ~~Filter `correctMap` ke soal selesai di `GetProgressDetail` (Q1 — satu baris, dampak terbesar).~~ ✅ Selesai 2026-09-07.
2. Bedakan `nil` vs kosong di `ListChapters` / `AccessibleClassIDs` (M1).
3. Tambah batas percobaan atau kunci jawaban setelah submit pertama + jangan kembalikan `correct_answer_ids` saat salah (Q2).
4. `material_count` hanya hitung `published` (M2); scope role `user` di `ListChapters` (M3).
5. Hapus/isi `quiz_packages.is_free` ( sinkron dari koleksi atau hapus kolom) + validasi `answer_id` ∈ soal (Q3, Q4).
6. Jangka panjang: ownership chapter atau pisah flag izin chapter vs materi (M4); mode preview guru terpisah dari progress murid (Q9).

## 8. Referensi file utama

- `backend/cmd/server/main.go:90-128` — grup route & mounting.
- `backend/internal/middleware/auth.go:104-136` — `ContentManager`; `middleware/access.go` — `AccessibleClassIDs`/`CanAccessClass`/`CanAccessPremium`.
- `backend/internal/models/teacher_permission.go`, `models/student_class.go`, `models/question_package.go`, `models/question_package_collection.go`, `models/questionbank_question.go`, `models/questionbank_answer.go`, `models/student_question_progress.go`, `models/material.go`, `models/chapter.go`.
- `backend/internal/material/{handler,service,repository}.go`, `backend/internal/chapter/{handler,service,repository,cover_handler}.go`.
- `backend/internal/questionpackage/{handler,service,repository}.go`, `backend/internal/questionbank/{handler,service}.go`.
- Frontend: `web/src/routes/_dashboard/{teacher/chapters/**,teacher/packs/**,student/materials/**,student/packages/**,user/materials*,admin/teacher-permissions.tsx,admin/subscriptions/**,student/subscribe.tsx}`.
