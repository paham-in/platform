# Progress Platform — paham.in

## Student

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard | ⚠️ Sebagian | Stat cards angka hardcoded, belum real dari API |
| Materi — list chapter | ✅ | Filter kelas, subjek, search |
| Materi — detail chapter | ✅ | |
| Materi — detail konten | ✅ | Render HTML content |
| Forum — list pertanyaan | ✅ | Filter subjek, search |
| Forum — buat pertanyaan | ✅ | Tiptap editor + upload gambar |
| Forum — detail + jawab | ✅ | |
| Forum — pertanyaan saya | ✅ | Filter `?mine=true` |
| Forum — hapus pertanyaan | ✅ | |
| Settings — edit profil | ✅ | Nama, kelas |

❌ **Belum ada:**
- Lihat status pembayaran sendiri
- Progress tracking per materi
- Tugas/ujian
- Riwayat belajar

---

## Teacher

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard | ⚠️ Sebagian | Stat cards hardcoded |
| Forum — list | ✅ | Sama dengan student |
| Forum — buat/jawab | ✅ | |
| Settings | ✅ | |
| "Materi Saya" | ⚠️ Pakai route `/materials` yang sama dengan student | Tidak ada filter khusus atau dashboard guru |

❌ **Belum ada:**
- Buat materi sendiri (create/edit — hanya admin yang bisa)
- Lihat progress murid
- Fitur khusus guru selain forum

---

## Admin

| Fitur | Status | Catatan |
|-------|--------|---------|
| Dashboard | ✅ | Stat real dari DB, padding/gap konsisten pake bawaan shadcn |
| Kelola User | ✅ | CRUD, ganti role, hapus |
| Pembayaran (invoice) | ✅ | Buat invoice, toggle status, bulk action (checkbox + batch toggle), hapus hard-delete, dropdown menu, search + filter status |
| Kelas | ✅ | CRUD |
| Mata Pelajaran | ✅ | CRUD |
| Chapter | ✅ | CRUD |
| Materi | ✅ | CRUD, publish/draft toggle |
| Forum | ✅ | List + hapus pertanyaan |

❌ **Belum ada:**
- Laporan pendapatan (total invoice lunas, per bulan)
- Log aktivitas
- Setting biaya default per kelas
- Filter pembayaran berdasarkan kelas (kelas murid)

---

## Masalah Umum

1. **Dashboard student & teacher** — stat cards masih hardcoded. **Admin sudah real dari DB**
2. **Guru tidak punya akses manage materi** — hanya bisa forum. Seharusnya guru bisa create/edit materi
3. **Student tidak bisa lihat status pembayaran**
4. **Auth** — hanya Google OAuth + login admin via seed. Tidak ada registrasi manual (mungkin disengaja)
5. **Notifikasi** — tidak ada sistem notifikasi sama sekali (push, in-app, email)

---

## Fitur Ideal Platform Bimbel — Kesenjangan per Role

Daftar fitur yang seharusnya ada di platform bimbel lengkap, ditandai mana yang sudah (✅) dan belum (❌).

### Student

| Kategori | Fitur | Status |
|----------|-------|--------|
| **Belajar** | Lihat materi (teks/gambar/video) | ✅ |
| | Filter materi by kelas & subjek | ✅ |
| | Search materi | ❌ |
| | Bookmark / simpan materi | ❌ |
| | Riwayat akses materi | ❌ |
| | Progress belajar (% selesai per chapter) | ❌ |
| | Catatan pribadi per materi | ❌ |
| **Tugas** | Lihat daftar tugas | ❌ |
| | Kumpulkan tugas (upload file) | ❌ |
| | Lihat nilai & feedback guru | ❌ |
| **Forum** | Lihat semua pertanyaan | ✅ |
| | Buat pertanyaan + upload gambar | ✅ |
| | Hapus pertanyaan sendiri | ✅ |
| **Ujian** | Ikut ujian online (pilihan ganda, essay) | ❌ |
| | Lihat hasil ujian & pembahasan | ❌ |
| | Timer otomatis | ❌ |
| **Pembayaran** | Lihat status invoice sendiri | ❌ |
| | Riwayat pembayaran | ❌ |
| **Jadwal** | Lihat jadwal belajar / jadwal les | ❌ |
| **Les Privat** | Lihat daftar guru | ✅ |
| | Lihat jadwal tersedia guru | ✅ |
| | Booking jadwal les | ✅ |
| | Lihat status booking | ✅ |
| **Pengaturan** | Edit profil (nama, kelas) | ✅ |
| | Ganti password / email | ❌ |
| | Upload avatar | ❌ |
| **Notifikasi** | In-app notification (ada jawaban baru) | ❌ |
| | Push notification (mobile) | ❌ |
| | Email notifikasi | ❌ |
| **Dashboard** | Stat real (progress, materi selesai, dll) | ❌ |

---

### Teacher

| Kategori | Fitur | Status |
|----------|-------|--------|
| **Materi** | Buat materi sendiri | ❌ |
| | Edit materi | ❌ |
| | Upload file ke materi | ❌ |
| | Atur urutan materi per chapter | ❌ |
| **Tugas** | Buat tugas untuk murid | ❌ |
| | Lihat kumpulan tugas murid | ❌ |
| | Beri nilai & feedback | ❌ |
| **Ujian** | Buat soal ujian (PG, essay) | ❌ |
| | Atur batas waktu | ❌ |
| | Lihat hasil ujian semua murid | ❌ |
| **Forum** | Jawab pertanyaan murid | ✅ |
| | Lihat pertanyaan belum terjawab | ❌ |
| **Les Privat** | Atur jadwal tersedia (hari + jam) | ✅ |
| | Lihat permintaan booking murid | ✅ |
| | Setujui/tolak booking | ✅ |
| | Lihat riwayat booking | ✅ |
| **Kelas** | Lihat daftar murid per kelas | ❌ |
| | Lihat progress murid per materi | ❌ |
| **Dashboard** | Stat real | ❌ |
| **Notifikasi** | Ada pertanyaan baru dari murid | ❌ |
| **Pengaturan** | Edit profil | ✅ |

---

### Admin

| Kategori | Fitur | Status |
|----------|-------|--------|
| **Dashboard** | Stat real dari DB | ✅ |
| **User** | CRUD user | ✅ |
| | Ganti role, hapus user | ✅ |
| | Import user (CSV/Excel) | ❌ |
| **Materi** | CRUD + publish/draft | ✅ |
| | Autosave draft ke localStorage saat create/edit | ✅ |
| | Restore draft dialog (lanjutkan/mulai baru) | ✅ |
| **Kelas** | CRUD | ✅ |
| **Mata Pelajaran** | CRUD | ✅ |
| **Chapter** | CRUD | ✅ |
| **Pembayaran** | Invoice per user | ✅ |
| | Toggle status, bulk action | ✅ |
| | Search + filter invoice | ✅ |
| | Laporan pendapatan (bulanan/tahunan) | ❌ |
| | Grafik pendapatan | ❌ |
| | Ekspor laporan (PDF/Excel) | ❌ |
| **Forum** | Hapus pertanyaan | ✅ |
| **Tugas/Ujian** | CRUD semua | ❌ |
| **Notifikasi** | Kirim ke murid/guru | ❌ |
| **Log** | Catat aktivitas | ❌ |
| **Pengaturan** | Biaya default per kelas | ❌ |
| | Template email | ❌ |
| | Tampilan/logo | ❌ |

---

## Saran Pengembangan Selanjutnya

### Prioritas Tinggi

| # | Fitur | Alasan |
|---|-------|--------|
| 1 | **Guru: akses buat/edit materi** | Guru saat ini cuma bisa forum. Buat materi adalah core functionality guru. Backend udah siap (endpoint `/admin/materials`), tinggal buka akses role teacher + halaman frontend |
| 2 | **Filter + search pembayaran admin** | ✅ Selesai — search by note/periode + filter status dropdown |
| 3 | **Dashboard real untuk student** | Stat cards masih hardcoded. Bikin endpoint aggregasi (total materi selesai, progress, sesi terakhir) |

### Prioritas Sedang

| # | Fitur | Alasan |
|---|-------|--------|
| 4 | **Student lihat status pembayaran** | Tampilkan status invoice di halaman profil atau dashboard student |
| 5 | **Laporan pendapatan admin** | Dashboard admin: total invoice lunas per bulan, total revenue, grafik. Pake data dari tabel `invoices` yang udah ada |
| 6 | **Guru dashboard real data** | Total materi dibuat, pertanyaan terjawab, jumlah siswa — tinggal bikin endpoint aggregasi |

### Prioritas Rendah

| # | Fitur | Alasan |
|---|-------|--------|
| 7 | **Progress tracking** | Catat history akses materi per student |
| 8 | **Role-based routing** | Pisah route student/teacher/admin biar gak campur di satu halaman |
| 9 | **Riwayat pembayaran student** | Student bisa lihat history invoice sendiri |
| 10 | **Log aktivitas admin** | Catat setiap aksi admin (hapus user, ubah status, dll) |
