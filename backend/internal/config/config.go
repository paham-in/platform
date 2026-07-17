package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DBHost            string
	DBPort            string
	DBUser            string
	DBPass            string
	DBName            string
	AdminName         string
	AdminEmail        string
	AdminPass         string
	GoogleClientID    string
	GoogleClientSecret string
	GoogleCallbackURL string
	AppURL            string
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
		AdminName:          getEnv("ADMIN_NAME", "Admin Bimbel"),
		AdminEmail:         getEnv("ADMIN_EMAIL", "admin@bimbel.com"),
		AdminPass:          getEnv("ADMIN_PASS", "admin123"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", "http://localhost:8080/auth/google/callback"),
		AppURL:             getEnv("APP_URL", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
