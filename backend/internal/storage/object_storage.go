package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"strings"
	"time"

	"bimbel2/backend/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go/middleware"
	smithyhttp "github.com/aws/smithy-go/transport/http"
	"github.com/google/uuid"
)

// stripRustfsHeadersID adalah ID middleware yang membuang header yang tidak
// dikenali rustfs sebelum proses signing.
const stripRustfsHeadersID = "stripRustfsHeaders"

// stripRustfsHeaders menambahkan middleware S3 client yang menghapus header
// yang ikut ditandatangani AWS SDK v2 tapi tidak ada di canonical request
// rustfs (Accept-Encoding, Amz-Sdk-Invocation-Id, Amz-Sdk-Request). Tanpa ini
// rustfs menolak dengan SignatureDoesNotMatch.
func stripRustfsHeaders() func(*middleware.Stack) error {
	return func(stack *middleware.Stack) error {
		// Middleware SDK yang menambahkan Accept-Encoding: identity. Header ini
		// tidak dipakai rustfs, buang agar tidak masuk signed headers.
		stack.Finalize.Remove("DisableAcceptEncodingGzip")
		// Path presign (PresignClient) membuang header tsb sendiri dan belum
		// memiliki "Signing", skip agar Insert tidak error.
		if _, ok := stack.Finalize.Get("Signing"); !ok {
			return nil
		}
		return stack.Finalize.Insert(middleware.FinalizeMiddlewareFunc(
			stripRustfsHeadersID,
			func(ctx context.Context, in middleware.FinalizeInput, next middleware.FinalizeHandler) (middleware.FinalizeOutput, middleware.Metadata, error) {
				if req, ok := in.Request.(*smithyhttp.Request); ok {
					req.Header.Del("Accept-Encoding")
					req.Header.Del("Amz-Sdk-Invocation-Id")
					req.Header.Del("Amz-Sdk-Request")
				}
				return next.HandleFinalize(ctx, in)
			}), "Signing", middleware.Before)
	}
}

// ObjectStorage wraps an S3-compatible client (rustfs).
type ObjectStorage struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
	// publicBase = <endpoint>/<bucket>, dipakai buat URL publik konten
	// (prefix public/). Diresolve di NewObjectStorage dari endpoint+bucket.
	publicBase string
}

func NewObjectStorage(cfg *config.Config) (*ObjectStorage, error) {
	// resolveInternal mengubah host:port → scheme+host:port buat S3 client.
	// scheme ikut RustfsUseSSL.
	resolveInternal := func(hostport string) string {
		if !strings.Contains(hostport, "://") {
			scheme := "http://"
			if cfg.RustfsUseSSL {
				scheme = "https://"
			}
			return scheme + hostport
		}
		return hostport
	}

	// endpoint internal yang dipakai S3 client (antar-container docker
	// network). Boleh HTTP, tidak terlihat browser.
	endpoint := resolveInternal(cfg.RustfsEndpoint)

	sdkCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.RustfsAccessKey, cfg.RustfsSecretKey, "")),
		awsconfig.WithRegion("us-east-1"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load aws config: %w", err)
	}

	client := s3.NewFromConfig(sdkCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
		o.RequestChecksumCalculation = aws.RequestChecksumCalculationWhenRequired
		o.ResponseChecksumValidation = aws.ResponseChecksumValidationWhenRequired
		o.APIOptions = append(o.APIOptions, stripRustfsHeaders())
	})

	ctx := context.Background()
	bucket := cfg.RustfsBucket

	_, err = client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(bucket)})
	if err != nil {
		_, err = client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(bucket)})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Printf("storage bucket '%s' created", bucket)
	}

	// URL publik konten: <publicEndpoint>/<bucket>/<object>. Ini yang dipakai
	// browser untuk akses konten prefix `public/`. Wajib reachable dan HTTPS
	// (mixed-content). Default fallback ke endpoint internal agar dev tanpa
	// RUSTFS_PUBLIC_ENDPOINT tetap jalan.
	publicBase := endpoint
	if cfg.RustfsPublicEndpoint != "" {
		publicBase = resolveInternal(cfg.RustfsPublicEndpoint)
	}
	publicBase = strings.TrimRight(publicBase, "/") + "/" + bucket

	return &ObjectStorage{client: client, presign: s3.NewPresignClient(client), bucket: bucket, publicBase: publicBase}, nil
}

func (s *ObjectStorage) Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader) (string, error) {
	objectName := s.GenerateObjectName(header.Filename)
	contentType := header.Header.Get("Content-Type")

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(objectName),
		Body:          file,
		ContentType:   &contentType,
		ContentLength: aws.Int64(header.Size),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload: %w", err)
	}

	return objectName, nil
}

func (s *ObjectStorage) UploadReader(ctx context.Context, objectName, contentType string, reader io.Reader, size int64) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(objectName),
		Body:          reader,
		ContentType:   &contentType,
		ContentLength: aws.Int64(size),
	})
	if err != nil {
		return fmt.Errorf("failed to upload: %w", err)
	}
	return nil
}

func (s *ObjectStorage) PresignedURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	req, err := s.presign.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectName),
	}, func(o *s3.PresignOptions) {
		o.Expires = expiry
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}
	return req.URL, nil
}

// PublicURL merangkai URL publik langsung untuk object prefix `public/`.
func (s *ObjectStorage) PublicURL(objectName string) string {
	return s.publicBase + "/" + objectName
}

// URL mengembalikan URL akses object: konten publik (prefix public/) →
// URL langsung tanpa tanda tangan; selain itu (legacy forum/covers, private/)
// → presigned URL. Caller tinggal panggil ini, tanpa peduli prefix.
func (s *ObjectStorage) URL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	if strings.HasPrefix(objectName, "public/") {
		return s.PublicURL(objectName), nil
	}
	return s.PresignedURL(ctx, objectName, expiry)
}

func (s *ObjectStorage) Delete(ctx context.Context, objectName string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectName),
	})
	if err != nil {
		return fmt.Errorf("failed to delete: %w", err)
	}
	return nil
}

func (s *ObjectStorage) GenerateObjectName(filename string) string {
	return s.GenerateObjectNameIn("materials", filename)
}

// GenerateObjectNameIn membuat nama object konten publik:
// `public/<folder>/<uuid><ext>`. Object ini di-serve langsung tanpa tanda tangan.
func (s *ObjectStorage) GenerateObjectNameIn(folder, filename string) string {
	return fmt.Sprintf("public/%s/%s%s", folder, uuid.NewString(), extOf(filename))
}

// GenerateObjectNamePrivateIn membuat nama object privat:
// `private/<folder>/<uuid><ext>`. Cuma bisa diakses via presigned URL.
func (s *ObjectStorage) GenerateObjectNamePrivateIn(folder, filename string) string {
	return fmt.Sprintf("private/%s/%s%s", folder, uuid.NewString(), extOf(filename))
}

func extOf(filename string) string {
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			return filename[i:]
		}
	}
	return ""
}
