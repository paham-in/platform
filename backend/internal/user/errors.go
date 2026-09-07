package user

import "errors"

var (
	errEmailExists = errors.New("email sudah terdaftar")
	errNotFound    = errors.New("user tidak ditemukan")
	errInternal    = errors.New("terjadi kesalahan server")
)
