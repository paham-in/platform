package gallery

import (
	"bytes"
	"image/jpeg"
	"io"
	"strconv"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	db      *gorm.DB
	storage *storage.ObjectStorage
}

func NewHandler(db *gorm.DB, store *storage.ObjectStorage) *Handler {
	return &Handler{db: db, storage: store}
}

type GalleryImageResponse struct {
	ID           uint   `json:"id"`
	URL          string `json:"url"`
	ObjectName   string `json:"object_name"`
	OriginalName string `json:"original_name"`
	Title        string `json:"title"`
	IsOwner      bool   `json:"is_owner"`
	CreatedAt    string `json:"created_at"`
}

type GalleryDeleteResponse struct {
	Message string `json:"message"`
}

type GalleryErrorResponse struct {
	Error string `json:"error"`
}

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

func (h *Handler) isAdmin(c *fiber.Ctx) bool {
	roles, _ := c.Locals("roles").([]string)
	for _, r := range roles {
		if r == "admin" {
			return true
		}
	}
	return false
}

// canAccessSubject memastikan user boleh menyentuh subject ini: admin selalu,
// teacher hanya yang dia ajar (tabel teacher_subjects). Tutup IDOR gallery.
func (h *Handler) canAccessSubject(c *fiber.Ctx, subjectID uint) error {
	if h.isAdmin(c) {
		return nil
	}
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(GalleryErrorResponse{Error: "unauthorized"})
	}
	var n int64
	if err := h.db.Model(&models.TeacherSubject{}).
		Where("user_id = ? AND subject_id = ?", userID, subjectID).Count(&n).Error; err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal memeriksa akses"})
	}
	if n == 0 {
		return c.Status(403).JSON(GalleryErrorResponse{Error: "bukan subject yang kamu ajar"})
	}
	return nil
}

// UploadSubjectImage mengunggah gambar ke gallery subject
// @Summary      Upload subject image
// @Description  Mengunggah gambar ke gallery subject
// @Tags         Admin Gallery
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Param        image formData file true "File gambar"
// @Param        title formData string false "Judul gambar"
// @Success      201 {object} GalleryImageResponse
// @Failure      400 {object} GalleryErrorResponse
// @Router       /admin/subjects/{subject_id}/images [post]
func (h *Handler) Upload(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "id tidak valid"})
	}

	var sub models.Subject
	if err := h.db.First(&sub, subjectID).Error; err != nil {
		return c.Status(404).JSON(GalleryErrorResponse{Error: "subject tidak ditemukan"})
	}
	if err := h.canAccessSubject(c, uint(subjectID)); err != nil {
		return err
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "format file harus jpg, png, gif, atau webp"})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	srcBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal membaca file"})
	}

	img, err := imaging.Decode(bytes.NewReader(srcBytes))
	if err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "format gambar tidak didukung"})
	}
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal mengompres gambar"})
	}

	objectName := h.storage.GenerateObjectName("gallery.jpg")
	err = h.storage.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal mengunggah file"})
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
		// file sudah terupload ke storage — hapus biar tidak jadi orphan.
		h.storage.Delete(c.Context(), objectName)
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal menyimpan data"})
	}

	return c.Status(201).JSON(GalleryImageResponse{
		ID:           rec.ID,
		URL:          objectName,
		ObjectName:   objectName,
		OriginalName: file.Filename,
		Title:        title,
		IsOwner:      true,
		CreatedAt:    rec.CreatedAt.Format("2006-01-02 15:04"),
	})
}

// ListSubjectImages mengembalikan daftar gambar gallery subject
// @Summary      List subject images
// @Description  Mengembalikan daftar gambar gallery subject
// @Tags         Admin Gallery
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Param        q query string false "Filter by title"
// @Success      200 {array} GalleryImageResponse
// @Router       /admin/subjects/{subject_id}/images [get]
func (h *Handler) List(c *fiber.Ctx) error {
	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "id tidak valid"})
	}
	if err := h.canAccessSubject(c, uint(subjectID)); err != nil {
		return err
	}

	q := c.Query("q", "")
	var images []models.SubjectImage
	query := h.db.Where("subject_id = ?", subjectID)
	// teacher cuma lihat upload-an sendiri; admin semua.
	if !h.isAdmin(c) {
		query = query.Where("user_id = ?", userIDFrom(c))
	}
	if q != "" {
		query = query.Where("title ILIKE ?", "%"+q+"%")
	}
	if err := query.Order("created_at desc").Find(&images).Error; err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal mengambil data"})
	}

	currentUser := userIDFrom(c)
	result := make([]GalleryImageResponse, len(images))
	for i, img := range images {
		resolvedURL, err := h.storage.URL(c.Context(), img.FileName, 24*time.Hour)
		url := img.FileName
		if err == nil {
			url = resolvedURL
		}
		result[i] = GalleryImageResponse{
			ID:           img.ID,
			URL:          url,
			ObjectName:   img.FileName,
			OriginalName: img.OriginalName,
			Title:        img.Title,
			IsOwner:      img.UserID == currentUser,
			CreatedAt:    img.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return c.JSON(result)
}

type MaterialRef struct {
	ID    uint   `json:"id"`
	Title string `json:"title"`
}

// GalleryUsageResponse: satu gambar + di materi mana ia dipakai.
type GalleryUsageResponse struct {
	ID           uint          `json:"id"`
	URL          string        `json:"url"`
	ObjectName   string        `json:"object_name"`
	Title        string        `json:"title"`
	IsOwner      bool          `json:"is_owner"`
	UsedIn       []MaterialRef `json:"used_in"`
	UsageCount   int           `json:"usage_count"`
}

// UsageSubjectImages mengembalikan pemakaian tiap gambar gallery di materi.
// @Summary      Subject images usage
// @Description  Deteksi di materi mana tiap gambar gallery dipakai (berdasarkan objectName di content)
// @Tags         Admin Gallery
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Success      200 {array} GalleryUsageResponse
// @Failure      400 {object} GalleryErrorResponse
// @Router       /admin/subjects/{subject_id}/images/usage [get]
func (h *Handler) Usage(c *fiber.Ctx) error {
	subjectID, err := strconv.ParseUint(c.Params("subject_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "id tidak valid"})
	}
	if err := h.canAccessSubject(c, uint(subjectID)); err != nil {
		return err
	}

	var images []models.SubjectImage
	query := h.db.Where("subject_id = ?", subjectID)
	// teacher cuma lihat upload-an sendiri; admin semua.
	if !h.isAdmin(c) {
		query = query.Where("user_id = ?", userIDFrom(c))
	}
	if err := query.Order("created_at desc").Find(&images).Error; err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal mengambil data"})
	}

	// Muat semua content materi sekali, scan in-memory. Skala dev OK;
	// upgrade path: tabel material_images kalau materi sudah ribuan.
	var materials []models.Material
	if err := h.db.Select("id", "title", "content").Find(&materials).Error; err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal mengambil materi"})
	}

	currentUser := userIDFrom(c)
	result := make([]GalleryUsageResponse, len(images))
	for i, img := range images {
		resolvedURL, err := h.storage.URL(c.Context(), img.FileName, 24*time.Hour)
		url := img.FileName
		if err == nil {
			url = resolvedURL
		}
		used := make([]MaterialRef, 0, 1)
		for _, m := range materials {
			if m.Content != "" && strings.Contains(m.Content, img.FileName) {
				used = append(used, MaterialRef{ID: m.ID, Title: m.Title})
			}
		}
		result[i] = GalleryUsageResponse{
			ID:         img.ID,
			URL:        url,
			ObjectName: img.FileName,
			Title:      img.Title,
			IsOwner:    img.UserID == currentUser,
			UsedIn:     used,
			UsageCount: len(used),
		}
	}
	return c.JSON(result)
}

// DeleteSubjectImage menghapus gambar dari gallery
// @Summary      Delete subject image
// @Description  Menghapus gambar dari gallery subject
// @Tags         Admin Gallery
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id path int true "Subject ID"
// @Param        id path int true "Image ID"
// @Success      200 {object} GalleryDeleteResponse
// @Failure      403 {object} GalleryErrorResponse
// @Failure      404 {object} GalleryErrorResponse
// @Router       /admin/subjects/{subject_id}/images/{id} [delete]
func (h *Handler) Delete(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(GalleryErrorResponse{Error: "unauthorized"})
	}

	imageID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(GalleryErrorResponse{Error: "id tidak valid"})
	}

	var img models.SubjectImage
	if err := h.db.First(&img, imageID).Error; err != nil {
		return c.Status(404).JSON(GalleryErrorResponse{Error: "gambar tidak ditemukan"})
	}
	if err := h.canAccessSubject(c, img.SubjectID); err != nil {
		return err
	}

	// admin boleh hapus gambar siapa pun; teacher cuma punya sendiri.
	if !h.isAdmin(c) && img.UserID != userID {
		return c.Status(403).JSON(GalleryErrorResponse{Error: "bukan pemilik gambar"})
	}

	// Hapus file dari storage. Gagal di sini → tolak, biar DB row tidak hilang
	// tapi file masih nyangkut (inconsistency).
	if err := h.storage.Delete(c.Context(), img.FileName); err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal menghapus file: " + err.Error()})
	}
	if err := h.db.Delete(&img).Error; err != nil {
		return c.Status(500).JSON(GalleryErrorResponse{Error: "gagal menghapus data: " + err.Error()})
	}

	return c.JSON(GalleryDeleteResponse{Message: "gambar berhasil dihapus"})
}

func Routes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	h := NewHandler(db, store)
	admin.Get("/subjects/:subject_id/images", h.List)
	admin.Post("/subjects/:subject_id/images", h.Upload)
	admin.Get("/subjects/:subject_id/images/usage", h.Usage)
	admin.Delete("/subjects/:subject_id/images/:id", h.Delete)
}
