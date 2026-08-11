package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPass             string
	DBName             string
	AdminName          string
	AdminEmail         string
	AdminPass          string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string
	AppURL             string
	VapidPublicKey     string
	VapidPrivateKey    string
	VapidSubject       string
	RustfsEndpoint     string
	RustfsAccessKey    string
	RustfsSecretKey    string
	RustfsBucket       string
	RustfsUseSSL       bool
	TeacherFeePercent  float64
	EvidenceRetentionDays int
	DevResetEnabled    bool
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPass:             getEnv("DB_PASS", "postgres"),
		DBName:             getEnv("DB_NAME", "bimbel"),
		AdminName:          getEnv("ADMIN_NAME", "Admin paham.in"),
		AdminEmail:         getEnv("ADMIN_EMAIL", "gnoogler4@gmail.com"),
		AdminPass:          getEnv("ADMIN_PASS", "admin123"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", "http://localhost:8080/auth/google/callback"),
		AppURL:             getEnv("APP_URL", "http://localhost:5173"),
		VapidPublicKey:     getEnv("VAPID_PUBLIC_KEY", ""),
		VapidPrivateKey:    getEnv("VAPID_PRIVATE_KEY", ""),
		VapidSubject:       getEnv("VAPID_SUBJECT", "mailto:admin@paham.in"),
		RustfsEndpoint:     getEnv("RUSTFS_ENDPOINT", "stb:9000"),
		RustfsAccessKey:    getEnv("RUSTFS_ACCESS_KEY", "rustfsadmin"),
		RustfsSecretKey:    getEnv("RUSTFS_SECRET_KEY", "rustfsadmin"),
		RustfsBucket:       getEnv("RUSTFS_BUCKET", "bimbel"),
		RustfsUseSSL:       getEnvEnabled("RUSTFS_USE_SSL"),
		TeacherFeePercent:  getEnvFloat("TEACHER_FEE_PERCENT", 70),
		EvidenceRetentionDays: getEnvInt("EVIDENCE_RETENTION_DAYS", 7),
		DevResetEnabled:    getEnvEnabled("DEV_RESET_ENABLED"),
	}
}

// getEnvEnabled true kalau var ADA dan nilainya bukan "false"/"0"/"no".
// Var tidak ada → false (disable). Dev-only fitur default mati.
func getEnvEnabled(key string) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	return v != "" && v != "false" && v != "0" && v != "no"
}

func getEnvFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
