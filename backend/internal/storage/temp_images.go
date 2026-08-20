package storage

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// TempContentImageRe mencocokkan referensi gambar temp di HTML content.
// Bentuk: `public/temp_<fitur>/<uuid>.<ext>`, bisa berawalan URL publik (hasil
// upload langsung), prefix URL ikut di-capture untuk dinormalisasi.
var TempContentImageRe = regexp.MustCompile(`(?:https?://[^"'\s]+/)?(public/temp_[a-z_]+/[0-9a-fA-F-]+\.(?:jpg|jpeg|png|gif|webp))(?:\?[^"'\s]*)?`)

// TempImage adalah object temp yang belum di-commit ke lokasi permanen.
type TempImage struct {
	ObjectName   string
	LastModified time.Time
}

// CommitTempImages memindahkan semua gambar temp yang direferensikan di content
// ke lokasi permanen (`public/temp_<fitur>/...` → `public/<fitur>/...`) dan
// mengganti referensinya di HTML dengan object name baru. Content di DB selalu
// berbentuk object name. Nil-receiver aman, content dikembalikan apa adanya.
func (s *ObjectStorage) CommitTempImages(ctx context.Context, content string) (string, error) {
	if s == nil {
		return content, nil
	}
	var err error
	out := TempContentImageRe.ReplaceAllStringFunc(content, func(m string) string {
		if err != nil {
			return m
		}
		obj := TempContentImageRe.FindStringSubmatch(m)[1]
		newObj, e := s.moveTempToPermanent(ctx, obj)
		if e != nil {
			err = e
			return m
		}
		return newObj
	})
	if err != nil {
		return content, err
	}
	return out, nil
}

// moveTempToPermanent menyalin object temp ke folder permanen dengan UUID baru,
// lalu menghapus object temp. Mengembalikan object name permanen.
func (s *ObjectStorage) moveTempToPermanent(ctx context.Context, obj string) (string, error) {
	rest := strings.TrimPrefix(obj, "public/temp_")
	slash := strings.Index(rest, "/")
	if slash <= 0 {
		return "", fmt.Errorf("format object temp tidak valid: %s", obj)
	}
	feature := rest[:slash]
	newObj := s.GenerateObjectNameIn(feature, rest[slash:])
	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(s.bucket),
		CopySource: aws.String(s.bucket + "/" + obj),
		Key:        aws.String(newObj),
	})
	if err != nil {
		return "", fmt.Errorf("gagal menyalin %s → %s: %w", obj, newObj, err)
	}
	if err := s.Delete(ctx, obj); err != nil {
		return "", fmt.Errorf("gagal menghapus temp %s: %w", obj, err)
	}
	return newObj, nil
}

// ListTempImages mencantumkan semua object di prefix public/temp_ beserta waktu
// terakhir diubah. Dipakai cron cleanup untuk menghapus upload yang ditinggalkan.
func (s *ObjectStorage) ListTempImages(ctx context.Context) ([]TempImage, error) {
	var out []TempImage
	var token *string
	for {
		resp, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
			Bucket:            aws.String(s.bucket),
			Prefix:            aws.String("public/temp_"),
			ContinuationToken: token,
		})
		if err != nil {
			return nil, err
		}
		for _, obj := range resp.Contents {
			if obj.Key == nil || strings.HasSuffix(*obj.Key, "/") {
				continue
			}
			last := time.Time{}
			if obj.LastModified != nil {
				last = *obj.LastModified
			}
			out = append(out, TempImage{ObjectName: *obj.Key, LastModified: last})
		}
		if resp.IsTruncated == nil || !*resp.IsTruncated {
			break
		}
		token = resp.NextContinuationToken
	}
	return out, nil
}