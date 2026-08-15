package answer

import (
	"bytes"
	"image/jpeg"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/push"
	"bimbel2/backend/internal/storage"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc   *Service
	store *storage.ObjectStorage
}

func NewHandler(svc *Service, store *storage.ObjectStorage) *Handler {
	return &Handler{svc: svc, store: store}
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type AnswerResponse struct {
	ID           uint     `json:"id"`
	Content      string   `json:"content"`
	PlainContent string   `json:"plain_content"`
	VideoURL     string   `json:"video_url"`
	Images       []string `json:"images,omitempty"`
	UserName     string   `json:"user_name"`
	UserAvatar   string   `json:"user_avatar,omitempty"`
	IsOwner      bool     `json:"is_owner"`
	CreatedAt    string   `json:"created_at"`
}

type CreateAnswerInput struct {
	Content  string `json:"content"`
	VideoURL string `json:"video_url"`
}

// reYoutube memvalidasi link YouTube (youtube.com/watch|embed|shorts atau youtu.be).
var reYoutube = regexp.MustCompile(`^(https?://)?(www\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/)[a-zA-Z0-9_-]{11}`)

func hasTeacherRole(c *fiber.Ctx) bool {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return false
	}
	for _, r := range u.Roles {
		if r.Name == "teacher" {
			return true
		}
	}
	return false
}

type MessageResponse struct {
	Message string `json:"message"`
}

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

// ListAnswers mengembalikan daftar jawaban untuk sebuah pertanyaan
// @Summary      List answers
// @Description  Mengembalikan daftar jawaban berdasarkan ID pertanyaan
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Success      200 {array} AnswerResponse
// @Router       /questions/{question_id}/answers [get]
func (h *Handler) ListAnswers(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	answers, err := h.svc.ListByQuestion(uint(id))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	// muat gambar pendukung per jawaban (satu query untuk semua jawaban).
	imageMap := map[uint][]string{}
	images, err := h.svc.ListImages(uint(id))
	if err == nil {
		for _, img := range images {
			url := img.FileName
			if resolved, err := h.store.URL(c.Context(), img.FileName, 24*time.Hour); err == nil {
				url = resolved
			}
			imageMap[img.AnswerID] = append(imageMap[img.AnswerID], url)
		}
	}

	currentUser := userIDFrom(c)
	result := make([]AnswerResponse, len(answers))
	for i, a := range answers {
		result[i] = AnswerResponse{
			ID:           a.ID,
			Content:      a.Content,
			PlainContent: a.PlainContent,
			VideoURL:     a.VideoURL,
			Images:       imageMap[a.ID],
			UserName:     a.User.Name,
			UserAvatar:   a.User.AvatarURL,
			IsOwner:      a.UserID == currentUser,
			CreatedAt:    a.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return c.JSON(result)
}

// CreateAnswer menambahkan jawaban ke pertanyaan
// @Summary      Create answer
// @Description  Menambahkan jawaban ke pertanyaan
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        body body CreateAnswerInput true "Data jawaban"
// @Success      201 {object} AnswerResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /questions/{question_id}/answers [post]
func (h *Handler) CreateAnswer(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	questionID, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input CreateAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Content == "" && input.VideoURL == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "content atau video_url wajib diisi"})
	}
	// hanya guru yang boleh menjawab — admin/student read-only supaya jawaban
	// di forum benar-benar akurat.
	if !hasTeacherRole(c) {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya guru yang bisa menjawab pertanyaan"})
	}
	if input.VideoURL != "" && !reYoutube.MatchString(input.VideoURL) {
		return c.Status(400).JSON(ErrorResponse{Error: "format video_url tidak valid"})
	}

	answer, err := h.svc.Create(uint(questionID), userID, input.Content, input.VideoURL)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(AnswerResponse{
		ID:           answer.ID,
		Content:      answer.Content,
		PlainContent: answer.PlainContent,
		VideoURL:     answer.VideoURL,
		UserName:     answer.User.Name,
		UserAvatar:   answer.User.AvatarURL,
		IsOwner:      true,
		CreatedAt:    time.Now().Format("2006-01-02 15:04"),
	})
}

type UploadResponse struct {
	ID       uint   `json:"id"`
	URL      string `json:"url"`
	FileName string `json:"file_name"`
}

// UploadAnswerImage mengunggah gambar pendukung jawaban forum
// @Summary      Upload answer image
// @Description  Mengunggah gambar pendukung ke jawaban forum (hanya guru)
// @Tags         Forum
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        answer_id   path int true "Answer ID"
// @Param        image formData file true "File gambar"
// @Success      201 {object} UploadResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /questions/{question_id}/answers/{answer_id}/images [post]
func (h *Handler) UploadAnswerImage(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}
	// hanya guru yang boleh menjawab — gambar pendukung jawaban ikut dibatasi.
	if !hasTeacherRole(c) {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya guru yang bisa mengunggah gambar jawaban"})
	}

	answerID, err := strconv.ParseUint(c.Params("answer_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	a, err := h.svc.GetAnswer(uint(answerID))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "jawaban tidak ditemukan"})
	}
	if a.UserID != userID {
		return c.Status(403).JSON(ErrorResponse{Error: "bukan pemilik jawaban"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "file tidak ditemukan"})
	}

	ct := file.Header.Get("Content-Type")
	if ct != "image/jpeg" && ct != "image/png" && ct != "image/gif" && ct != "image/webp" {
		return c.Status(400).JSON(ErrorResponse{Error: "format file harus jpg, png, gif, atau webp"})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(ErrorResponse{Error: "file maksimal 5MB"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}
	defer f.Close()

	// read all bytes
	srcBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal membaca file"})
	}

	// decode
	img, err := imaging.Decode(bytes.NewReader(srcBytes))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "format gambar tidak didukung"})
	}

	// resize if wider than 1920px
	if img.Bounds().Dx() > 1920 {
		img = imaging.Resize(img, 1920, 0, imaging.Lanczos)
	}

	// encode as JPEG quality 80
	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengompres gambar"})
	}

	compressed := buf.Bytes()

	// preserve original extension hint for object name
	ext := ".jpg"
	if strings.HasSuffix(strings.ToLower(file.Filename), ".png") {
		ext = ".png"
	}

	// gambar pendukung jawaban forum → folder khusus, jangan ikut
	// public/materials (default GenerateObjectName).
	objectName := h.store.GenerateObjectNameIn("forum_answers", "img"+ext)

	err = h.store.UploadReader(c.Context(), objectName, "image/jpeg", bytes.NewReader(compressed), int64(len(compressed)))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengunggah file"})
	}

	imgRecord, err := h.svc.AddImage(a.ID, objectName)
	if err != nil {
		// file sudah terupload ke storage — hapus biar tidak jadi orphan.
		h.store.Delete(c.Context(), objectName)
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan data"})
	}

	return c.Status(201).JSON(UploadResponse{
		ID:       imgRecord.ID,
		URL:      objectName,
		FileName: file.Filename,
	})
}

// DeleteAnswer menghapus jawaban
// @Summary      Delete answer
// @Description  Menghapus jawaban (hanya milik sendiri)
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        id path int true "Answer ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /questions/{question_id}/answers/{id} [delete]
func (h *Handler) DeleteAnswer(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id), userID); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func PublicRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	h := NewHandler(svc, store)

	app.Get("/questions/:question_id/answers", middleware.OptionalSessionResolver(db), h.ListAnswers)
}

func AuthRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage, pushSvc *push.Service) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	svc.SetPushService(pushSvc)
	svc.SetStorage(store)
	h := NewHandler(svc, store)

	app.Post("/questions/:question_id/answers", h.CreateAnswer)
	app.Delete("/questions/:question_id/answers/:id", h.DeleteAnswer)
	app.Post("/questions/:question_id/answers/:answer_id/images", h.UploadAnswerImage)
}