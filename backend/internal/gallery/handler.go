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
	Title        string `json:"title"`
	IsOwner      bool   `json:"is_owner"`
	CreatedAt    string `json:"created_at"`
}

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

func (h *Handler) Upload(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

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

	title := c.FormValue("title", "")

	rec := models.SubjectImage{
		SubjectID:    uint(subjectID),
		UserID:       userID,
		FileName:     objectName,
		OriginalName: file.Filename,
		Title:        title,
	}
	if err := h.db.Create(&rec).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan data"})
	}

	return c.Status(201).JSON(ImageResponse{
		ID:           rec.ID,
		URL:          objectName,
		OriginalName: file.Filename,
		Title:        title,
		IsOwner:      true,
		CreatedAt:    rec.CreatedAt.Format("2006-01-02 15:04"),
	})
}

func (h *Handler) List(c *fiber.Ctx) error {
	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	q := c.Query("q", "")
	var images []models.SubjectImage
	query := h.db.Where("subject_id = ?", subjectID)
	if q != "" {
		query = query.Where("title ILIKE ?", "%"+q+"%")
	}
	if err := query.Order("created_at desc").Find(&images).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data"})
	}

	currentUser := userIDFrom(c)
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
			Title:        img.Title,
			IsOwner:      img.UserID == currentUser,
			CreatedAt:    img.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return c.JSON(result)
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	imageID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var img models.SubjectImage
	if err := h.db.First(&img, imageID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "gambar tidak ditemukan"})
	}

	if img.UserID != userID {
		return c.Status(403).JSON(fiber.Map{"error": "bukan pemilik gambar"})
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
