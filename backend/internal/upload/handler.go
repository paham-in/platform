package upload

import (
	"bytes"
	"image/jpeg"
	"io"
	"strings"

	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	storage *storage.ObjectStorage
}

func NewHandler(store *storage.ObjectStorage) *Handler {
	return &Handler{storage: store}
}

type TempUploadResponse struct {
	URL        string `json:"url"`
	ObjectName string `json:"object_name"`
}

type TempUploadErrorResponse struct {
	Error string `json:"error"`
}

type TempDeleteRequest struct {
	URL string `json:"url"`
}

type TempDeleteResponse struct {
	OK bool `json:"ok"`
}

// tempFolders: whitelist folder temp yang boleh dipakai. Untuk sekarang cuma
// forum questions; fitur lain (materials, quiz_questions) menyusul.
var tempFolders = map[string]bool{
	"forum_questions": true,
}

// UploadTemp mengunggah gambar ke folder temp untuk editor content
// @Summary      Upload temp image
// @Description  Mengunggah gambar ke storage temp (public/temp_<folder>/). Gambar dipindahkan ke lokasi permanen (public/<folder>/) saat content di-submit. Folder sekarang: forum_questions.
// @Tags         Upload
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        image formData file true "Gambar (jpg, png, gif, webp, maks 5MB)"
// @Param        folder formData string false "Folder temp (default: forum_questions)"
// @Success      201 {object} TempUploadResponse
// @Failure      400 {object} TempUploadErrorResponse
// @Failure      500 {object} TempUploadErrorResponse
// @Router       /content/temp-images [post]
func (h *Handler) UploadTemp(c *fiber.Ctx) error {
	folder := c.FormValue("folder", "forum_questions")
	if !tempFolders[folder] {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "folder tidak valid"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "format file harus jpg, png, gif, atau webp"})
	}
	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	srcBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "gagal membaca file"})
	}
	img, err := imaging.Decode(bytes.NewReader(srcBytes))
	if err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "format gambar tidak didukung"})
	}
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "gagal mengompres gambar"})
	}

	objectName := h.storage.GenerateObjectNameIn("temp_"+folder, "temp.jpg")
	err = h.storage.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "gagal mengunggah file"})
	}

	return c.Status(201).JSON(TempUploadResponse{
		URL:        h.storage.PublicURL(objectName),
		ObjectName: objectName,
	})
}

// DeleteTemp menghapus gambar temp dari storage
// @Summary      Delete temp image
// @Description  Menghapus gambar temp (public/temp_<folder>/) dari storage. Hanya object temp di folder whitelist yang boleh dihapus.
// @Tags         Upload
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body TempDeleteRequest true "URL atau object name gambar temp"
// @Success      200 {object} TempDeleteResponse
// @Failure      400 {object} TempUploadErrorResponse
// @Failure      500 {object} TempUploadErrorResponse
// @Router       /content/temp-images [delete]
func (h *Handler) DeleteTemp(c *fiber.Ctx) error {
	var req TempDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "body tidak valid"})
	}
	m := storage.TempContentImageRe.FindStringSubmatch(req.URL)
	if len(m) != 2 {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "object temp tidak valid"})
	}
	obj := m[1]
	rest := strings.TrimPrefix(obj, "public/temp_")
	slash := strings.Index(rest, "/")
	if slash <= 0 || !tempFolders[rest[:slash]] {
		return c.Status(400).JSON(TempUploadErrorResponse{Error: "object temp tidak valid"})
	}
	if err := h.storage.Delete(c.Context(), obj); err != nil {
		return c.Status(500).JSON(TempUploadErrorResponse{Error: "gagal menghapus file"})
	}
	return c.Status(200).JSON(TempDeleteResponse{OK: true})
}

func AuthRoutes(auth fiber.Router, store *storage.ObjectStorage) {
	h := NewHandler(store)
	auth.Post("/content/temp-images", h.UploadTemp)
	auth.Delete("/content/temp-images", h.DeleteTemp)
}