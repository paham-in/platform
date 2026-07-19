package gallery

import (
	"bytes"
	"image/jpeg"
	"io"
	"strconv"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	db    *gorm.DB
	minio *storage.MinioClient
}

func NewHandler(db *gorm.DB, minio *storage.MinioClient) *Handler {
	return &Handler{db: db, minio: minio}
}

type ImageResponse struct {
	ID           uint   `json:"id"`
	URL          string `json:"url"`
	OriginalName string `json:"original_name"`
	CreatedAt    string `json:"created_at"`
}

// UploadSubjectImage mengunggah gambar ke gallery subject
// @Summary      Upload subject image
// @Description  Mengunggah gambar ke gallery subject
// @Tags         Gallery
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Param        image formData file true "File gambar"
// @Success      201 {object} ImageResponse
// @Failure      400 {object} map[string]string
// @Router       /admin/subjects/{subject_id}/images [post]
func (h *Handler) Upload(c *fiber.Ctx) error {
	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var sub models.Subject
	if err := h.db.First(&sub, subjectID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "subject tidak ditemukan"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(fiber.Map{"error": "format file harus jpg, png, gif, atau webp"})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membaca file"})
	}
	defer f.Close()

	srcBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membaca file"})
	}

	img, err := imaging.Decode(bytes.NewReader(srcBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "format gambar tidak didukung"})
	}
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengompres gambar"})
	}

	objectName := h.minio.GenerateObjectName("gallery.jpg")
	err = h.minio.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengunggah file"})
	}

	rec := models.SubjectImage{
		SubjectID:    uint(subjectID),
		FileName:     objectName,
		OriginalName: file.Filename,
	}
	if err := h.db.Create(&rec).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan data"})
	}

	return c.Status(201).JSON(ImageResponse{
		ID:           rec.ID,
		URL:          objectName,
		OriginalName: file.Filename,
		CreatedAt:    rec.CreatedAt.Format("2006-01-02 15:04"),
	})
}

// ListSubjectImages mengembalikan daftar gambar gallery subject
// @Summary      List subject images
// @Description  Mengembalikan daftar gambar gallery subject
// @Tags         Gallery
// @Produce      json
// @Param        subject_id path int true "Subject ID"
// @Success      200 {array} ImageResponse
// @Router       /admin/subjects/{subject_id}/images [get]
func (h *Handler) List(c *fiber.Ctx) error {
	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var images []models.SubjectImage
	if err := h.db.Where("subject_id = ?", subjectID).Order("created_at desc").Find(&images).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data"})
	}

	result := make([]ImageResponse, len(images))
	for i, img := range images {
		presignedURL, err := h.minio.PresignedURL(c.Context(), img.FileName, 24*time.Hour)
		url := img.FileName
		if err == nil {
			url = presignedURL
		}
		result[i] = ImageResponse{
			ID:           img.ID,
			URL:          url,
			OriginalName: img.OriginalName,
			CreatedAt:    img.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return c.JSON(result)
}

// DeleteSubjectImage menghapus gambar dari gallery
// @Summary      Delete subject image
// @Description  Menghapus gambar dari gallery subject
// @Tags         Gallery
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Param        id path int true "Image ID"
// @Success      200 {object} map[string]string
// @Router       /admin/subjects/{subject_id}/images/{id} [delete]
func (h *Handler) Delete(c *fiber.Ctx) error {
	imageID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var img models.SubjectImage
	if err := h.db.First(&img, imageID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "gambar tidak ditemukan"})
	}

	_ = h.minio.Delete(c.Context(), img.FileName)
	h.db.Delete(&img)

	return c.JSON(fiber.Map{"message": "gambar berhasil dihapus"})
}

func Routes(admin fiber.Router, db *gorm.DB, minioClient *storage.MinioClient) {
	h := NewHandler(db, minioClient)

	admin.Get("/subjects/:subject_id/images", h.List)
	admin.Post("/subjects/:subject_id/images", h.Upload)
	admin.Delete("/subjects/:subject_id/images/:id", h.Delete)
}
