package models

import "github.com/google/uuid"

// NewPublicID generates a new UUID v4 for use as a public identifier.
func NewPublicID() string {
	return uuid.NewString()
}
