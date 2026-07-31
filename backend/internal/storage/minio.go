package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"time"

	"bimbel2/backend/internal/config"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	client *minio.Client
	bucket string
}

func NewMinioClient(cfg *config.Config) (*MinioClient, error) {
	client, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to minio: %w", err)
	}

	ctx := context.Background()
	bucket := cfg.MinioBucket

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket: %w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Printf("MinIO bucket '%s' created", bucket)
	}

	return &MinioClient{client: client, bucket: bucket}, nil
}

func (m *MinioClient) Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader) (string, error) {
	ext := ""
	if header.Filename != "" {
		for i := len(header.Filename) - 1; i >= 0; i-- {
			if header.Filename[i] == '.' {
				ext = header.Filename[i:]
				break
			}
		}
	}

	objectName := fmt.Sprintf("forum/%s%s", uuid.NewString(), ext)

	_, err := m.client.PutObject(ctx, m.bucket, objectName, file, header.Size, minio.PutObjectOptions{
		ContentType: header.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload: %w", err)
	}

	return objectName, nil
}

func (m *MinioClient) UploadReader(ctx context.Context, objectName, contentType string, reader io.Reader, size int64) error {
	_, err := m.client.PutObject(ctx, m.bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload: %w", err)
	}
	return nil
}

func (m *MinioClient) PresignedURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	url, err := m.client.PresignedGetObject(ctx, m.bucket, objectName, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}
	return url.String(), nil
}

func (m *MinioClient) Delete(ctx context.Context, objectName string) error {
	return m.client.RemoveObject(ctx, m.bucket, objectName, minio.RemoveObjectOptions{})
}

func (m *MinioClient) GenerateObjectName(filename string) string {
	ext := ""
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			ext = filename[i:]
			break
		}
	}
	return fmt.Sprintf("forum/%s%s", uuid.NewString(), ext)
}

