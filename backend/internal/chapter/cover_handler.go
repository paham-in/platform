package chapter

import (
	"strconv"
	"strings"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CoverHandler struct {
	db    *gorm.DB
	minio *storage.MinioClient
}

func NewCoverHandler(db *gorm.DB, minio *storage.MinioClient) *CoverHandler {
	return &CoverHandler{db: db, minio: minio}
}

// UploadCover mengunggah gambar cover chapter
// @Summary      Upload chapter cover
// @Description  Mengunggah gambar cover untuk chapter
// @Tags         Chapters
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id    path int true "Chapter ID"
// @Param        image formData file true "File gambar"
// @Success      200  {object} MessageResponse
// @Failure      400  {object} ErrorResponse
// @Router       /admin/chapters/{id}/cover [post]
func (h *CoverHandler) UploadCover(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var chapter models.Chapter
	if err := h.db.First(&chapter, id).Error; err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "chapter tidak ditemukan"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(ErrorResponse{Error: "format harus jpg, png, gif, atau webp"})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(ErrorResponse{Error: "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	objectName := h.minio.GenerateObjectNameIn("covers", file.Filename)
	if err := h.minio.UploadReader(c.Context(), objectName, ct, f, file.Size); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah gambar"})
	}

	// delete old cover if exists
	if chapter.CoverURL != "" && strings.HasPrefix(chapter.CoverURL, "covers/") {
		_ = h.minio.Delete(c.Context(), chapter.CoverURL)
	}

	h.db.Model(&chapter).Update("cover_url", objectName)

	return c.JSON(MessageResponse{Message: "cover berhasil diupload"})
}

func CoverRoutes(admin fiber.Router, db *gorm.DB, minio *storage.MinioClient) {
	h := NewCoverHandler(db, minio)
	admin.Post("/chapters/:id/cover", h.UploadCover)
}
