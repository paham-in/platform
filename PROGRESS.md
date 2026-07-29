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
| Dashboard | ✅ | Stat real: total murid, guru, mapel, materi dari DB + daftar user terkini |
| Kelola User | ✅ | CRUD, ganti role, hapus |
| Pembayaran (invoice) | ✅ | Buat invoice, toggle status, bulk action (checkbox + batch toggle), hapus hard-delete |
| Kelas | ✅ | CRUD |
| Mata Pelajaran | ✅ | CRUD |
| Chapter | ✅ | CRUD |
| Materi | ✅ | CRUD, publish/draft toggle |
| Forum | ✅ | List + hapus pertanyaan |

❌ **Belum ada:**
- Laporan pendapatan (total invoice lunas, per bulan)
- Log aktivitas
- Setting biaya default per kelas

---

## Masalah Umum

1. **Dashboard student & teacher** — stat cards masih hardcoded. **Admin sudah real dari DB**
2. **Guru tidak punya akses manage materi** — hanya bisa forum. Seharusnya guru bisa create/edit materi
3. **Student tidak bisa lihat status pembayaran**
4. **Auth** — hanya Google OAuth + login admin via seed. Tidak ada registrasi manual (mungkin disengaja)
