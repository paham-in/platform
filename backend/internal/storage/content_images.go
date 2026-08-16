package storage

import (
	"context"
	"regexp"
	"time"
)

// ContentImageRe mencocokkan referensi gambar storage di dalam HTML content.
// Bentuk tersimpan: `public/materials/<uuid>.<ext>` (gambar materi),
// `public/quiz_questions/<uuid>.<ext>` (gambar soal & pembahasan),
// `public/quiz_answers/<uuid>.<ext>` (gambar opsi jawaban),
// `public/forum_questions/<uuid>.<ext>` (gambar content pertanyaan forum),
// `public/forum_answers/<uuid>.<ext>` (gambar content jawaban forum), atau
// `forum/<uuid>.<ext>` (legacy). `public/questions/<uuid>.<ext>` juga masih
// diterima sebagai legacy (gambar paket soal lama). Prefix `public/temp_<fitur>/`
// (gambar temp editor) ikut diterima supaya bisa di-sanitize/di-extract. Bisa
// juga berawalan URL (presigned lama / public base) — prefix URL ikut di-capture
// untuk dinormalisasi. Query string presigned (X-Amz-*) ikut dikonsumsi supaya
// tidak tersisa saat strip.
var ContentImageRe = regexp.MustCompile(`(?:https?://[^"'\s]+/)?((?:public/(?:materials|quiz_questions|quiz_answers|forum_questions|forum_answers|questions|temp_[a-z_]+)|forum)/[0-9a-fA-F-]+\.(?:jpg|jpeg|png|gif|webp))(?:\?[^"'\s]*)?`)

// SanitizeContentImages menormalkan presigned URL → objectName (group 1).
// Dipakai pas simpan: content dari editor bisa kebawa URL fresh (karena serve
// selalu rewrite), harus dikembalikan ke objectName biar stabil & tidak expire.
func SanitizeContentImages(content string) string {
	return ContentImageRe.ReplaceAllString(content, "$1")
}

// ExtractContentImages mengambil semua object name gambar yang direferensikan
// di HTML content (group 1 dari ContentImageRe). Dipakai untuk mencatat aset
// content (tabel *_assets) dan mendeteksi gambar yang dihapus saat edit.
func ExtractContentImages(content string) []string {
	matches := ContentImageRe.FindAllStringSubmatch(content, -1)
	out := make([]string, 0, len(matches))
	for _, m := range matches {
		out = append(out, m[1])
	}
	return out
}

// RewriteContentImages mengganti objectName di HTML content → URL akses.
// Content di DB selalu objectName (lihat SanitizeContentImages). `public/`
// → URL publik langsung; legacy `forum/` & `private/` → presigned URL.
// Di-rewrite tiap serve biar stabil (presigned expire). Nil-receiver aman
// (storage boleh nil saat storage mati) — content dikembalikan apa adanya.
func (s *ObjectStorage) RewriteContentImages(content string) string {
	if s == nil {
		return content
	}
	return ContentImageRe.ReplaceAllStringFunc(content, func(m string) string {
		obj := ContentImageRe.FindStringSubmatch(m)[1]
		if url, err := s.URL(context.Background(), obj, 24*time.Hour); err == nil {
			return url
		}
		return obj
	})
}
