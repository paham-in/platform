package setting

import (
	"errors"
	"strconv"
)

// Key-konfigurasi yang dikenal.
const (
	KeyTeacherFeePercent = "teacher_fee_percent"
)

const defaultFeePercent = 70.0

// AllowedKeys = key yang boleh di-set lewat API.
var AllowedKeys = map[string]bool{
	KeyTeacherFeePercent: true,
}

type Service struct {
	repo          *Repository
	envFeePercent float64
}

func NewService(repo *Repository, envFeePercent float64) *Service {
	return &Service{repo: repo, envFeePercent: envFeePercent}
}

func (s *Service) feeFallback() float64 {
	if s.envFeePercent != 0 {
		return s.envFeePercent
	}
	return defaultFeePercent
}

// TeacherFeePercent membaca fee guru dari DB; kalau belum ada/invalid pakai env, lalu default 70.
func (s *Service) TeacherFeePercent() float64 {
	v, err := s.repo.Get(KeyTeacherFeePercent)
	if err != nil || v == "" {
		return s.feeFallback()
	}
	if f, err := strconv.ParseFloat(v, 64); err == nil {
		return f
	}
	return s.feeFallback()
}

func (s *Service) GetMap() (map[string]string, error) {
	return s.repo.GetAll()
}

// Update menyimpan key yang dikenal; key asing ditolak. Validasi tiap nilai.
func (s *Service) Update(input map[string]string) error {
	for k, v := range input {
		if !AllowedKeys[k] {
			return errors.New("key tidak dikenal: " + k)
		}
		if err := validate(k, v); err != nil {
			return err
		}
	}
	for k, v := range input {
		if err := s.repo.Set(k, v); err != nil {
			return err
		}
	}
	return nil
}

func validate(key, value string) error {
	f, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return errors.New("nilai harus angka")
	}
	if key == KeyTeacherFeePercent && (f < 0 || f > 100) {
		return errors.New("fee harus 0-100")
	}
	return nil
}
