package upload

import (
	"strconv"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

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

type UploadResponse struct {
	ID       uint   `json:"id"`
	URL      string `json:"url"`
	FileName string `json:"file_name"`
}

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

func roleFrom(c *fiber.Ctx) string {
	r, _ := c.Locals("role").(string)
	return r
}

// UploadQuestionImage mengunggah gambar untuk pertanyaan
// @Summary      Upload question image
// @Description  Mengunggah gambar pendukung pertanyaan
// @Tags         Forum
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        image formData file true "File gambar"
// @Success      201 {object} UploadResponse
// @Failure      400 {object} map[string]string
// @Router       /questions/{question_id}/images [post]
func (h *Handler) UploadQuestionImage(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	questionID, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var q models.Question
	if err := h.db.First(&q, questionID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pertanyaan tidak ditemukan"})
	}
	if q.UserID != userID {
		role := roleFrom(c)
		if role != "admin" {
			return c.Status(403).JSON(fiber.Map{"error": "bukan pemilik pertanyaan"})
		}
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

	objectName, url, err := h.minio.Upload(c.Context(), f, file)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengunggah file"})
	}

	img := models.QuestionImage{
		QuestionID: uint(questionID),
		FileName:   objectName,
		URL:        url,
	}
	if err := h.db.Create(&img).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan data"})
	}

	return c.Status(201).JSON(UploadResponse{
		ID:       img.ID,
		URL:      img.URL,
		FileName: file.Filename,
	})
}

// ListQuestionImages mengembalikan gambar-gambar pertanyaan
// @Summary      List question images
// @Description  Mengembalikan daftar gambar pendukung pertanyaan
// @Tags         Forum
// @Produce      json
// @Param        question_id path int true "Question ID"
// @Success      200 {array} UploadResponse
// @Router       /questions/{question_id}/images [get]
func (h *Handler) ListQuestionImages(c *fiber.Ctx) error {
	questionID, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}

	var images []models.QuestionImage
	if err := h.db.Where("question_id = ?", questionID).Order("created_at asc").Find(&images).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data"})
	}

	result := make([]UploadResponse, len(images))
	for i, img := range images {
		result[i] = UploadResponse{
			ID:       img.ID,
			URL:      img.URL,
			FileName: img.FileName,
		}
	}
	return c.JSON(result)
}

func PublicRoutes(app fiber.Router, db *gorm.DB, minioClient *storage.MinioClient) {
	h := NewHandler(db, minioClient)

	app.Get("/questions/:question_id/images", h.ListQuestionImages)
}

func AuthRoutes(app fiber.Router, db *gorm.DB, minioClient *storage.MinioClient) {
	h := NewHandler(db, minioClient)

	app.Post("/questions/:question_id/images", h.UploadQuestionImage)
}
