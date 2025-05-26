package test

import (
	"socialbackend/pkg/auth"
	"testing"
)

func TestPasswordHashing(t *testing.T) {
	password := "securePassword123"

	// Test password hashing
	hash, err := auth.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	// Verify hash works
	if !auth.CheckPasswordHash(password, hash) {
		t.Fatalf("Password verification failed")
	}

	// Verify wrong password fails
	if auth.CheckPasswordHash("wrongPassword", hash) {
		t.Fatalf("Password verification should have failed but didn't")
	}
}
