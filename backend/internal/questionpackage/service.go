package questionpackage

import (
	"errors"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

// PackageQuestionResponse
type PackageQuestionResponse struct {
	ID       uint   `json:"id"`
	Question string `json:"question"`
}

// PackageResponse
type PackageResponse struct {
	ID            uint                     `json:"id"`
	Name          string                   `json:"name"`
	Description   string                   `json:"description"`
	SubjectID     uint                     `json:"subject_id"`
	SubjectName   string                   `json:"subject_name"`
	IsFree        bool                     `json:"is_free"`
	Status        string                   `json:"status"`
	CollectionID  uint                     `json:"collection_id"`
	CollectionName string                  `json:"collection_name"`
	Questions     []PackageQuestionResponse `json:"questions"`
	CreatedAt     string                   `json:"created_at"`
}

// CollectionResponse
type CollectionResponse struct {
	ID           uint              `json:"id"`
	Name         string            `json:"name"`
	ClassID      uint              `json:"class_id"`
	ClassName    string            `json:"class_name"`
	IsFree       bool              `json:"is_free"`
	Description  string            `json:"description"`
	PackageCount int               `json:"package_count"`
	Packages     []PackageResponse `json:"packages"`
	CreatedAt    string            `json:"created_at"`
}

type Service struct {
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, storage: store}
}

type CreateInput struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	SubjectID    uint   `json:"subject_id"`
	CollectionID uint   `json:"collection_id"`
	Status       string `json:"status"`
}

func (s *Service) Create(input CreateInput) (*PackageResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama paket wajib diisi")
	}
	if input.SubjectID == 0 {
		return nil, errors.New("mata pelajaran wajib diisi")
	}
	if input.CollectionID == 0 {
		return nil, errors.New("koleksi paket soal wajib diisi")
	}

	pkg := models.QuizPackage{
		Name:         input.Name,
		Description:  input.Description,
		SubjectID:    input.SubjectID,
		CollectionID: &input.CollectionID,
	}
	if input.Status == "" {
		pkg.Status = "draft"
	} else {
		pkg.Status = input.Status
	}
	if err := s.repo.Create(&pkg); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(pkg.ID)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Name          *string `json:"name"`
	Description   *string `json:"description"`
	SubjectID     *uint   `json:"subject_id"`
	CollectionID  *uint   `json:"collection_id"`
	Status        *string `json:"status"`
}

func (s *Service) Update(id uint, input UpdateInput) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	if input.Name != nil {
		pkg.Name = *input.Name
	}
	if input.Description != nil {
		pkg.Description = *input.Description
	}
	if input.SubjectID != nil {
		pkg.SubjectID = *input.SubjectID
	}
	if input.CollectionID != nil {
		pkg.CollectionID = input.CollectionID
	}
	if input.Status != nil {
		pkg.Status = *input.Status
	}
	if err := s.repo.Update(pkg); err != nil {
		return nil, err
	}
	updated, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*updated)
	return &r, nil
}

func (s *Service) List() ([]PackageResponse, error) {
	packages, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]PackageResponse, len(packages))
	for i, pkg := range packages {
		result[i] = s.toResponse(pkg)
	}
	return result, nil
}

// ListVisible untuk akses murid/user. classIDs non-nil membatasi koleksi premium ke
// kelas tertentu (nil = semua, staff); paket tanpa koleksi atau ber-status draft
// tidak pernah dikembalikan.
func (s *Service) ListVisible(classIDs []uint) ([]PackageResponse, error) {
	packages, err := s.repo.ListVisible(classIDs)
	if err != nil {
		return nil, err
	}
	result := make([]PackageResponse, len(packages))
	for i, pkg := range packages {
		result[i] = s.toResponse(pkg)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*pkg)
	return &r, nil
}

// ErrNoAccess dipakai GetVisible ketika paket di luar hak akses user.
var ErrNoAccess = errors.New("tidak ada akses ke paket ini")

// GetVisible mengambil detail paket untuk murid/user. classIDs nil = staff
// (lihat semua). Paket tanpa koleksi selalu ditolak untuk non-staff.
func (s *Service) GetVisible(id uint, classIDs []uint) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	if pkg.CollectionID == nil {
		return nil, ErrNoAccess
	}
	// draft hanya untuk staff (classIDs nil); murid tidak boleh melihatnya.
	if pkg.Status != "published" && classIDs != nil {
		return nil, ErrNoAccess
	}
	if classIDs != nil && !pkg.Collection.IsFree {
		allowed := false
		for _, cid := range classIDs {
			if cid == pkg.Collection.ClassID {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, ErrNoAccess
		}
	}
	r := s.toResponse(*pkg)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

type CollectionCreateInput struct {
	Name        string `json:"name"`
	ClassID     uint   `json:"class_id"`
	IsFree      bool   `json:"is_free"`
	Description string `json:"description"`
}

func (s *Service) CreateCollection(input CollectionCreateInput) (*CollectionResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama koleksi wajib diisi")
	}
	if input.ClassID == 0 {
		return nil, errors.New("kelas wajib diisi")
	}

	collection := models.QuizCollection{
		Name:        input.Name,
		ClassID:     input.ClassID,
		IsFree:      input.IsFree,
		Description: input.Description,
	}
	if err := s.repo.CreateCollection(&collection); err != nil {
		return nil, err
	}
	created, err := s.repo.GetCollection(collection.ID, nil)
	if err != nil {
		return nil, err
	}
	r := s.toCollectionResponse(*created)
	return &r, nil
}

type CollectionUpdateInput struct {
	Name        *string `json:"name"`
	ClassID     *uint   `json:"class_id"`
	IsFree      *bool   `json:"is_free"`
	Description *string `json:"description"`
}

func (s *Service) UpdateCollection(id uint, input CollectionUpdateInput) (*CollectionResponse, error) {
	collection, err := s.repo.GetCollection(id, nil)
	if err != nil {
		return nil, err
	}
	if input.Name != nil {
		collection.Name = *input.Name
	}
	if input.ClassID != nil {
		collection.ClassID = *input.ClassID
	}
	if input.IsFree != nil {
		collection.IsFree = *input.IsFree
	}
	if input.Description != nil {
		collection.Description = *input.Description
	}
	if err := s.repo.UpdateCollection(collection); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetCollection(id, nil)
	if err != nil {
		return nil, err
	}
	r := s.toCollectionResponse(*updated)
	return &r, nil
}

func (s *Service) DeleteCollection(id uint) error {
	return s.repo.DeleteCollection(id)
}

// ListCollections mengembalikan daftar koleksi. classIDs nil = semua (staff); non-nil
// membatasi ke kelas yang boleh diakses student (termasuk koleksi free).
func (s *Service) ListCollections(classIDs []uint) ([]CollectionResponse, error) {
	collections, err := s.repo.ListCollections(classIDs)
	if err != nil {
		return nil, err
	}
	result := make([]CollectionResponse, len(collections))
	for i, g := range collections {
		result[i] = s.toCollectionResponse(g)
	}
	return result, nil
}

func (s *Service) GetCollection(id uint, classIDs []uint) (*CollectionResponse, error) {
	collection, err := s.repo.GetCollection(id, classIDs)
	if err != nil {
		return nil, err
	}
	r := s.toCollectionResponse(*collection)
	return &r, nil
}

func (s *Service) toResponse(pkg models.QuizPackage) PackageResponse {
	questions := make([]PackageQuestionResponse, len(pkg.Questions))
	for i, q := range pkg.Questions {
		questions[i] = PackageQuestionResponse{
			ID:       q.ID,
			Question: s.storage.RewriteContentImages(q.Question),
		}
	}
	collectionID := uint(0)
	collectionName := ""
	if pkg.Collection.ID != 0 {
		collectionID = pkg.Collection.ID
		collectionName = pkg.Collection.Name
	}
	return PackageResponse{
		ID:             pkg.ID,
		Name:           pkg.Name,
		Description:    pkg.Description,
		SubjectID:      pkg.SubjectID,
		SubjectName:    pkg.Subject.Name,
		IsFree:         pkg.IsFree,
		Status:         pkg.Status,
		CollectionID:   collectionID,
		CollectionName: collectionName,
		Questions:      questions,
		CreatedAt:      pkg.CreatedAt.Format("2006-01-02 15:04"),
	}
}

func (s *Service) toCollectionResponse(g models.QuizCollection) CollectionResponse {
	packages := make([]PackageResponse, len(g.Packages))
	for i, p := range g.Packages {
		packages[i] = s.toResponse(p)
	}
	return CollectionResponse{
		ID:           g.ID,
		Name:         g.Name,
		ClassID:      g.ClassID,
		ClassName:    g.Class.Name,
		IsFree:       g.IsFree,
		Description:  g.Description,
		PackageCount: len(g.Packages),
		Packages:     packages,
		CreatedAt:    g.CreatedAt.Format("2006-01-02 15:04"),
	}
}

// SubmitAnswer menyimpan jawaban student untuk 1 soal.
// Mengembalikan is_correct, explanation, dan ID jawaban yang benar (untuk highlight kunci di FE).
func (s *Service) SubmitAnswer(userID, packageID, questionID uint, selectedAnswerID uint) (bool, string, []uint, error) {
	q, err := s.repo.GetQuestionWithAnswers(questionID)
	if err != nil {
		return false, "", nil, errors.New("soal tidak ditemukan")
	}
	if q.PackageID != packageID {
		return false, "", nil, errors.New("soal bukan milik paket ini")
	}
	isCorrect := false
	correctAnswerIDs := make([]uint, 0, len(q.Answers))
	for _, a := range q.Answers {
		if a.IsCorrect {
			correctAnswerIDs = append(correctAnswerIDs, a.ID)
			if a.ID == selectedAnswerID {
				isCorrect = true
			}
		}
	}
	if err := s.repo.SaveProgress(userID, packageID, questionID, isCorrect, selectedAnswerID); err != nil {
		return false, "", nil, err
	}
	return isCorrect, s.storage.RewriteContentImages(q.Explanation), correctAnswerIDs, nil
}

// GetStudentProgress mengembalikan daftar ID soal yang sudah dikerjakan.
func (s *Service) GetStudentProgress(userID, packageID uint) ([]uint, error) {
	return s.repo.GetCompletedQuestionIDs(userID, packageID)
}

// GetProgressDetail mengembalikan record progress + pembahasan per soal yang sudah dikerjakan.
// answers fe: map question_id → selected_answer_id; explanations: map question_id → explanation;
// correctAnswerIDs: map question_id → ID jawaban yang benar (untuk highlight kunci).
func (s *Service) GetProgressDetail(userID, packageID uint) (answers map[uint]uint, explanations map[uint]string, isCorrect map[uint]bool, correctAnswerIDs map[uint][]uint, err error) {
	progress, err := s.repo.GetCompletedProgress(userID, packageID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if len(progress) == 0 {
		return map[uint]uint{}, map[uint]string{}, map[uint]bool{}, map[uint][]uint{}, nil
	}
	questions, err := s.repo.ListByPackage(packageID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	explMap := make(map[uint]string, len(questions))
	correctMap := make(map[uint][]uint, len(questions))
	for _, q := range questions {
		explMap[q.ID] = s.storage.RewriteContentImages(q.Explanation)
		for _, a := range q.Answers {
			if a.IsCorrect {
				correctMap[q.ID] = append(correctMap[q.ID], a.ID)
			}
		}
	}
	answers = make(map[uint]uint, len(progress))
	explanations = make(map[uint]string, len(progress))
	isCorrect = make(map[uint]bool, len(progress))
	for _, p := range progress {
		answers[p.QuestionID] = p.SelectedAnswerID
		explanations[p.QuestionID] = explMap[p.QuestionID]
		isCorrect[p.QuestionID] = p.IsCorrect
	}
	return answers, explanations, isCorrect, correctMap, nil
}

// ListQuestionsForPackage mengembalikan soal + jawaban (untuk grading di backend).
func (s *Service) ListQuestionsForPackage(packageID uint) ([]models.QuizQuestion, error) {
	questions, err := s.repo.ListByPackage(packageID)
	if err != nil {
		return nil, err
	}
	// Rewrite images di service, bukan handler — handler tidak punya storage.
	for i := range questions {
		questions[i].Question = s.storage.RewriteContentImages(questions[i].Question)
		for j := range questions[i].Answers {
			questions[i].Answers[j].Content = s.storage.RewriteContentImages(questions[i].Answers[j].Content)
		}
	}
	return questions, nil
}
