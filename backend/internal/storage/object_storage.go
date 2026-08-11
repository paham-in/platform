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
	"github.com/google/uuid"
)

// ObjectStorage wraps an S3-compatible client (rustfs).
type ObjectStorage struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
}

func NewObjectStorage(cfg *config.Config) (*ObjectStorage, error) {
	endpoint := cfg.RustfsEndpoint
	if !strings.Contains(endpoint, "://") {
		scheme := "http://"
		if cfg.RustfsUseSSL {
			scheme = "https://"
		}
		endpoint = scheme + endpoint
	}

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

	return &ObjectStorage{client: client, presign: s3.NewPresignClient(client), bucket: bucket}, nil
}

func (s *ObjectStorage) Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader) (string, error) {
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
	return s.GenerateObjectNameIn("forum", filename)
}

func (s *ObjectStorage) GenerateObjectNameIn(folder, filename string) string {
	ext := ""
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			ext = filename[i:]
			break
		}
	}
	return fmt.Sprintf("%s/%s%s", folder, uuid.NewString(), ext)
}
