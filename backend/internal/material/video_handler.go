package material

import (
	"strconv"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type VideoHandler struct {
	db    *gorm.DB
	minio *storage.MinioClient
}

func NewVideoHandler(db *gorm.DB, minio *storage.MinioClient) *VideoHandler {
	return &VideoHandler{db: db, minio: minio}
}

// UploadVideo uploads a video file for a material (teacher/admin only)
// @Summary      Upload material video
// @Description  Upload video ke MinIO untuk materi
// @Tags         Materials
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id    path int true "Material ID"
// @Param        video formData file true "File video"
// @Success      200  {object} MaterialResponse
// @Failure      400  {object} ErrorResponse
// @Router       /admin/materials/{id}/video [post]
func (h *VideoHandler) UploadVideo(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var material models.Material
	if err := h.db.First(&material, id).Error; err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "materi tidak ditemukan"})
	}

	file, err := c.FormFile("video")
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "file tidak ditemukan"})
	}

	// allow mp4, webm, ogg
	name := strings.ToLower(file.Filename)
	if !strings.HasSuffix(name, ".mp4") && !strings.HasSuffix(name, ".webm") && !strings.HasSuffix(name, ".ogg") && !strings.HasSuffix(name, ".mov") {
		return c.Status(400).JSON(ErrorResponse{Error: "format harus mp4, webm, ogg, atau mov"})
	}

	// 200MB max
	if file.Size > 200*1024*1024 {
		return c.Status(400).JSON(ErrorResponse{Error: "file maksimal 200MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	objectName := h.minio.GenerateObjectNameIn("materials", file.Filename)
	contentType := videoContentType(file.Filename)
	if err := h.minio.UploadReader(c.Context(), objectName, contentType, f, file.Size); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah video"})
	}

	// if material already had a video, delete old one
	if material.VideoURL != "" && strings.HasPrefix(material.VideoURL, "materials/") {
		_ = h.minio.Delete(c.Context(), material.VideoURL)
	}

	h.db.Model(&material).Updates(map[string]any{
		"type":         "video",
		"video_source": "minio",
		"video_url":    objectName,
	})

	return c.JSON(fiber.Map{"message": "video berhasil diupload", "video_url": objectName})
}

// StreamVideo streams material video from MinIO with range support
// @Summary      Stream material video
// @Description  Streaming video materi dengan range support
// @Tags         Materials
// @Produce      video/mp4
// @Security     BearerAuth
// @Param        id path int true "Material ID"
// @Success      200
// @Failure      404 {object} ErrorResponse
// @Router       /materials/{id}/video [get]
func (h *VideoHandler) StreamVideo(c *fiber.Ctx) error {
	// validate session token via query param (video tag can't send auth header)
	token := c.Query("token")
	if token == "" {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}
	var session models.Session
	if err := h.db.Where("token = ? AND expires_at > ?", token, time.Now().Unix()).First(&session).Error; err != nil {
		return c.Status(401).JSON(ErrorResponse{Error: "session tidak valid"})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var material models.Material
	if err := h.db.First(&material, id).Error; err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "materi tidak ditemukan"})
	}

	if material.VideoURL == "" || material.VideoSource != "minio" {
		return c.Status(400).JSON(ErrorResponse{Error: "materi ini tidak punya video lokal"})
	}

	// generate presigned URL (15 min) and redirect — MinIO handles range/content-length/content-type
	presigned, err := h.minio.PresignedURL(c.Context(), material.VideoURL, 15*time.Minute)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal generate video url"})
	}
	return c.Redirect(presigned, fiber.StatusFound)
}

func videoContentType(name string) string {
	switch {
	case strings.HasSuffix(strings.ToLower(name), ".mp4"):
		return "video/mp4"
	case strings.HasSuffix(strings.ToLower(name), ".webm"):
		return "video/webm"
	case strings.HasSuffix(strings.ToLower(name), ".ogg"):
		return "video/ogg"
	case strings.HasSuffix(strings.ToLower(name), ".mov"):
		return "video/quicktime"
	}
	return ""
}

func parseRange(header string, size int64) (int64, int64, error) {
	header = strings.TrimPrefix(header, "bytes=")
	parts := strings.Split(header, "-")
	if len(parts) != 2 {
		return 0, 0, fiber.NewError(416)
	}

	startStr := strings.TrimSpace(parts[0])
	endStr := strings.TrimSpace(parts[1])

	if startStr == "" {
		// suffix range: bytes=-N → last N bytes
		n, err := strconv.ParseInt(endStr, 10, 64)
		if err != nil {
			return 0, 0, fiber.NewError(416)
		}
		if n > size {
			n = size
		}
		return size - n, size - 1, nil
	}

	start, err := strconv.ParseInt(startStr, 10, 64)
	if err != nil {
		return 0, 0, fiber.NewError(416)
	}

	end := size - 1
	if endStr != "" {
		end, err = strconv.ParseInt(endStr, 10, 64)
		if err != nil {
			return 0, 0, fiber.NewError(416)
		}
		if end >= size {
			end = size - 1
		}
	}

	if start > end || start >= size {
		return 0, 0, fiber.NewError(416)
	}

	return start, end, nil
}
