# Progress Platform — paham.in

## Student

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard `/student/dashboard` | ⚠️ Sebagian | Stat cards hardcoded, belum real dari API |
| Materi `/student/materials` | ✅ | Grid card, filter kelas/subjek/search |
| Materi — detail chapter | ✅ | |
| Materi — detail konten | ✅ | Render HTML content |
| Forum `/student/forum` | ✅ | Grid card, filter subjek, search |
| Forum — buat pertanyaan | ✅ | Tiptap editor + upload gambar |
| Forum — detail + jawab | ✅ | |
| Forum — pertanyaan saya | ✅ | Filter `?mine=true` |
| Forum — hapus pertanyaan | ✅ | |
| Les Privat `/student/tutoring` | ✅ | Lihat daftar guru, jadwal tersedia, booking, status |
| Settings — edit profil | ✅ | Nama, kelas |
| Sidebar grouped by role | ✅ | Menu "Murid" terpisah |

❌ **Belum ada:**
- Lihat status pembayaran sendiri
- Progress tracking per materi
- Tugas/ujian
- Riwayat belajar
- Dashboard real (endpoint aggregasi)

---

## Teacher

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard `/teacher/dashboard` | ⚠️ Sebagian | Stat cards hardcoded |
| Materi Saya `/teacher/materials` | ✅ | Table management, search, pagination |
| Materi — buat baru | ✅ | Tiptap editor, autosave draft, restore dialog |
| Materi — edit | ✅ | Autosave draft per ID |
| Materi — publish/draft toggle | ✅ | |
| Materi — hapus | ✅ | |
| Chapter `/teacher/chapters` | ✅ | CRUD (pindah dari admin) |
| Forum `/teacher/forum` | ✅ | Table, filter belum terjawab, lihat detail, jawab |
| Les Privat `/teacher/tutoring` | ✅ | Atur jadwal, lihat permintaan, setuju/tolak, riwayat |
| Settings | ✅ | |
| Sidebar grouped by role | ✅ | Menu "Guru" terpisah |

❌ **Belum ada:**
- Dashboard real (materi dibuat, pertanyaan terjawab, dari DB)
- Lihat progress murid
- Upload file ke materi
- Tugas (buat, nilai)

---

## Admin

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard `/admin/dashboard` | ✅ | Stat real dari DB |
| Kelola User | ✅ | CRUD, ganti role (via pivot), hapus |
| Pembayaran (invoice) | ✅ | Buat invoice, toggle, bulk action, search + filter, hapus hard-delete |
| Kelas | ✅ | CRUD |
| Mata Pelajaran | ✅ | CRUD |
| Chapter | ✅ | CRUD (backend, frontend di teacher) |
| Forum `/admin/forum` | ✅ | Table moderasi, hapus semua, lihat detail |
| Sidebar grouped by role | ✅ | Menu "Admin" terpisah |

❌ **Belum ada:**
- Laporan pendapatan
- Log aktivitas
- Import user (CSV/Excel)
- Ekspor laporan

---

## Fitur Baru (Recent)

| Fitur | Role | Status |
|-------|------|--------|
| Multi-role system (1 user bisa punya banyak role) | All | ✅ |
| Sidebar grouping per role | All | ✅ |
| Dashboard terpisah per role | All | ✅ |
| Auth callback redirect sesuai role | All | ✅ |
| Navbar landing → dashboard sesuai role | All | ✅ |
| Route refactor: `/student/`, `/teacher/`, `/admin/` | All | ✅ |
| Materi guru (CRUD table) | Teacher | ✅ |
| Materi murid (grid card) | Student | ✅ |
| Chapter pindah ke teacher | Teacher | ✅ |
| Les Privat (booking system) | Student + Teacher | ✅ |
| FieldGroup + Field component (shadcn) | All | ✅ |
| Calendar + Popover (shadcn) | All | ✅ |
| Autosave draft + restore dialog | Teacher | ✅ |
| Search + filter invoice | Admin | ✅ |
| Forum split per role (student grid, teacher/admin table) | All | ✅ |
| Filter "belum terjawab" di Tanya Jawab | Teacher | ✅ |
| Teacher detail forum buka tab baru | Teacher | ✅ |
| Label sidebar disamakan "Tanya Jawab" | All | ✅ |

---

## Arsitektur Routing

```
_dashboard/
├── _dashboard.tsx              → layout sidebar (grouped per role)
├── student/
│   ├── dashboard.tsx             /student/dashboard
│   ├── materials/                /student/materials, chapters/...
│   ├── forum/                    /student/forum, new, mine, $id
│   └── tutoring/                 /student/tutoring, /student/tutoring/$teacherId
├── teacher/
│   ├── dashboard.tsx             /teacher/dashboard
│   ├── chapters.tsx              /teacher/chapters
│   ├── materials/                /teacher/materials, new, $id/edit
│   ├── forum/                    /teacher/forum, $id
│   └── tutoring/                 /teacher/tutoring, availability
├── admin/
│   ├── dashboard.tsx             /admin/dashboard
│   ├── users.tsx                 /admin/users
│   ├── payments/                 /admin/payments, /admin/payments/$userId
│   ├── classes.tsx               /admin/classes
│   ├── subjects.tsx              /admin/subjects
│   └── forum/                    /admin/forum, $id
└── settings.tsx                  /settings
```

---

## Masalah Umum

1. **Dashboard student & teacher** — stat cards masih hardcoded. **Admin sudah real dari DB**
2. **Student tidak bisa lihat status pembayaran**
3. **Auth** — hanya Google OAuth + login admin via seed. Tidak ada registrasi manual
4. **Notifikasi** — 0 notifikasi (in-app, push, email)
5. **Guru tidak bisa lihat daftar murid per kelas**
6. **Filter "belum terjawab" masih cek count jawaban doang** — jawaban soft-delete masih dianggap ada

---

## Saran Pengembangan Selanjutnya

### Prioritas Tinggi

| # | Fitur | Alasan |
|---|-------|--------|
| 1 | **Dashboard real student & teacher** | Bikin endpoint aggregasi. Sekarang masih hardcoded semua |
| 2 | **Student lihat status pembayaran** | Tampilkan invoice status di profil atau dashboard student |
| 3 | **Fix filter unanswered** | Tambahin `deleted_at IS NULL` di subquery biar jawaban soft-delete gak dihitung |

### Prioritas Sedang

| # | Fitur | Alasan |
|---|-------|--------|
| 4 | **Laporan pendapatan admin** | Total invoice lunas per bulan, revenue, grafik. Data dari tabel `invoices` |
| 5 | **Filter admin berdasarkan kelas** | Filter user/pembayaran/chapter berdasarkan kelas |
| 6 | **Guru lihat murid per kelas** | Hubungin guru ke kelas, tampilkan daftar murid |

### Prioritas Rendah

| # | Fitur | Alasan |
|---|-------|--------|
| 7 | **Progress tracking** | Catat history akses materi per student |
| 8 | **Tugas & ujian online** | Sistem tugas, upload, nilai dari guru |
| 9 | **Log aktivitas admin** | Catat aksi admin (hapus user, ubah status, dll) |
| 10 | **Notifikasi** | In-app dulu, push nanti |
