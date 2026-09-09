package user

import "errors"

var (
	errEmailExists = errors.New("email sudah terdaftar")
	errNotFound    = errors.New("user tidak ditemukan")
	errInternal    = errors.New("terjadi kesalahan server")
	// errAccountDeleted dikembalikan saat identitas (email/google_id) milik
	// akun yang sudah soft-delete dipakai login/daftar lagi. Slot unique
	// masih ditempati baris terhapus, jadi tolak dengan pesan jelas sebelum
	// INSERT menabrak unique index.
	errAccountDeleted = errors.New("akun ini telah dinonaktifkan, hubungi admin untuk mengaktifkannya kembali")
)
