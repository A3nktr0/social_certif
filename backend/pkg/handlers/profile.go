package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/microcosm-cc/bluemonday"
)

type PublicProfile struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Avatar    string `json:"avatar"`
	Nickname  string `json:"nickname"`
	About     string `json:"about"`
	IsPrivate bool   `json:"is_private"`
	Dob       string `json:"dob"`
}

func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	requestedID := strings.TrimSpace(chi.URLParam(r, "id"))
	if requestedID == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	currentUserID := middleware.GetUserID(r)

	// Prepare nullable fields
	var (
		avatar, nickname, about sql.NullString
		profile                 PublicProfile
		dob                     time.Time
	)

	err := db.DB.QueryRow(`
		SELECT id, first_name, last_name, avatar, nickname, about, is_private, dob
		FROM users
		WHERE id = $1
	`, requestedID).Scan(
		&profile.ID,
		&profile.FirstName,
		&profile.LastName,
		&avatar,
		&nickname,
		&about,
		&profile.IsPrivate,
		&dob,
	)
	if err == sql.ErrNoRows {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Default avatar fallback
	profile.Avatar = avatar.String
	if !avatar.Valid || profile.Avatar == "" {
		profile.Avatar = "/static/avatars/default.jpg"
	}
	profile.Nickname = nickname.String

	// Access check
	hasAccess := currentUserID == profile.ID || !profile.IsPrivate

	if profile.IsPrivate && currentUserID != profile.ID {
		var status string
		err := db.DB.QueryRow(`
			SELECT status FROM follows
			WHERE follower_id = $1 AND followee_id = $2
		`, currentUserID, profile.ID).Scan(&status)

		if err == nil && status == "accepted" {
			hasAccess = true
		}
	}

	if hasAccess {
		profile.About = about.String
		if dob.IsZero() {
			profile.Dob = ""
		} else {
			profile.Dob = dob.Format("2006-01-02")
		}
	} else {
		profile.About = ""
		profile.Dob = ""
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

type UpdateProfileInput struct {
	FirstName string `json:"first_name" validate:"required,min=1,max=50"`
	LastName  string `json:"last_name" validate:"required,min=1,max=50"`
	DOB       string `json:"dob" validate:"required"`
	Nickname  string `json:"nickname" validate:"omitempty,min=2,max=30"`
	IsPrivate bool   `json:"is_private"`
	About     string `json:"about" validate:"omitempty,max=200"`
}

func UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var input UpdateProfileInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		fmt.Println("Error decoding JSON:", err)
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		http.Error(w, "Validation failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	dob, err := time.Parse("2006-01-02", input.DOB)
	if err != nil {
		http.Error(w, "Invalid date format (expected YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	// Sanitize inputs to prevent XSS
	p := bluemonday.StrictPolicy()
	input.FirstName = p.Sanitize(strings.TrimSpace(input.FirstName))
	input.LastName = p.Sanitize(strings.TrimSpace(input.LastName))
	input.Nickname = p.Sanitize(strings.TrimSpace(input.Nickname))
	input.About = p.Sanitize(strings.TrimSpace(input.About))

	_, err = db.DB.Exec(`
	UPDATE users SET
		first_name = $1,
		last_name = $2,
		nickname = $3,
		about = $4,
		is_private = $5,
		dob = $6
	WHERE id = $7
`, input.FirstName, input.LastName, nullIfEmpty(input.Nickname), nullIfEmpty(input.About), input.IsPrivate, dob, userID)

	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
