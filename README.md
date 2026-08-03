# paham.in

Platform bimbingan belajar online dengan materi terstruktur, forum tanya-jawab, dan les privat. Dibangun untuk menghubungkan murid, guru, dan admin dalam satu ekosistem belajar.

## Tentang

paham.in menyusun materi belajar secara hierarkis — **Kelas → Mata Pelajaran → Chapter → Materi** — sehingga murid bisa belajar sesuai alur yang terstruktur. Selain materi, platform ini menyediakan forum tanya-jawab ala Brainly dan layanan les privat online.

## Peran & Fitur

### 🎓 Murid
- **Dashboard** — ringkasan aktivitas belajar
- **Materi** — jelajahi materi per kelas/subjek, dengan pencarian dan filter
- **Tanya Jawab** — ajukan pertanyaan, unggah gambar, lihat pertanyaan milik sendiri
- **Les Privat** — cari guru berdasarkan mata pelajaran, lihat jadwal tersedia, booking slot
- **Pembayaran** — riwayat invoice dan status pembayaran sendiri

### 👨‍🏫 Guru
- **Dashboard** — ringkasan materi dan pertanyaan
- **Materi Saya** — kelola materi (buat, edit, publish/draft, hapus) dengan editor WYSIWYG
- **Chapter** — kelola chapter dan cover
- **Bank Soal** — buat & kelola soal per chapter, lengkap dengan pembahasan
- **Paket Soal** — kumpulkan soal dari bank soal menjadi paket
- **Tanya Jawab** — jawab pertanyaan murid, filter yang belum terjawab
- **Les Privat** — atur jadwal tersedia, setujui/tolak permintaan booking
- **Pengaturan** — atur mata pelajaran yang diajarkan

### 🛡️ Admin
- **Dashboard** — statistik pengguna & konten
- **Kelola User** — kelola user dan peran (murid/guru/admin)
- **Pembayaran** — buat dan kelola invoice
- **Konten** — kelola kelas, mata pelajaran, dan chapter
- **Moderasi** — kelola forum
- **Gallery** — kelola aset gambar

## Fitur Unggulan

- **Multi-peran** — satu akun bisa memiliki lebih dari satu peran
- **Materi hierarkis** — kelas → subjek → chapter → materi dengan editor WYSIWYG (Tiptap)
- **Forum tanya-jawab** — kolaborasi murid & guru dalam satu wadah
- **Les privat** — booking jadwal guru berdasarkan spesialisasi mata pelajaran
- **Bank & paket soal** — guru membangun soal terstruktur per chapter
- **Keamanan sesi** — autentikasi berbasis sesi dengan batasan satu-perangkat untuk murid dan sesi kedaluwarsa otomatis

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TanStack Router |
| Styling | TailwindCSS, shadcn/ui |
| State | TanStack Query |
| Editor | Tiptap (WYSIWYG) |
| Backend | Go, Fiber v2 |
| ORM | GORM |
| Database | PostgreSQL |
| Autentikasi | Session-based (token tersimpan di database) |
| API Docs | Swaggo (OpenAPI/Swagger) |
| SDK Client | @hey-api/openapi-ts (dibangkitkan dari spec OpenAPI) |

## Struktur Proyek

```
bimbel2/
├── backend/          # API server (Go + Fiber)
│   ├── cmd/server/   # Entry point
│   └── internal/     # Models, handler, service, repository per fitur
├── web/              # Frontend (React + Vite)
│   └── src/
│       ├── lib/api/  # SDK & hooks klien (dibangkitkan otomatis)
│       └── routes/   # Halaman & routing
└── docs/             # Dokumentasi
```

## Dokumentasi API

Spesifikasi API tersedia dalam format OpenAPI/Swagger yang dibangkitkan otomatis dari anotasi pada kode backend. SDK klien TypeScript (fungsi + hook TanStack Query) juga dibangkitkan dari spesifikasi yang sama, sehingga tipe data frontend selalu sinkron dengan backend.

## Status Proyek

Proyek dalam pengembangan aktif. Lihat `PRD.md` untuk detail produk dan `PROGRESS.md` untuk perkembangan fitur.

---

Dikembangkan dengan ❤️ untuk mendukung pendidikan di Indonesia.
