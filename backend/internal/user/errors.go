package user

import "errors"

var (
	errPasswordMismatch = errors.New("password tidak sama")
	errEmailExists      = errors.New("email sudah terdaftar")
	errInvalidCreds     = errors.New("email atau password salah")
	errInternal         = errors.New("terjadi kesalahan server")
)
