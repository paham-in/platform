package user

import "errors"

var (
	errPasswordMismatch = errors.New("password tidak sama")
	errEmailExists      = errors.New("email sudah terdaftar")
	errInvalidCreds     = errors.New("email atau password salah")
	errNotFound         = errors.New("user tidak ditemukan")
	errInternal         = errors.New("terjadi kesalahan server")
)
