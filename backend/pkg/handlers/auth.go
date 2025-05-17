package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"socialbackend/pkg/auth"
	"socialbackend/pkg/db"
	"socialbackend/pkg/users"

	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/microcosm-cc/bluemonday"
)

type RegisterInput struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required,min=1,max=50"`
	LastName  string `json:"last_name" validate:"required,min=1,max=50"`
	DOB       string `json:"dob" validate:"required"`
	Nickname  string `json:"nickname" validate:"min=2,max=30"`
	IsPrivate bool   `json:"is_private"`
	About     string `json:"about" validate:"omitempty,max=200"`
	Avatar    string `json:"avatar" validate:"omitempty,url"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func Health(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}
func Register(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(5 << 20) // 5MB max
	if err != nil {
		http.Error(w, "Invalid form submission", http.StatusBadRequest)
		return
	}

	p := bluemonday.StrictPolicy()

	get := func(field string) string {
		return strings.TrimSpace(r.FormValue(field))
	}

	email := p.Sanitize(get("email"))
	password := get("password")
	firstName := p.Sanitize(get("first_name"))
	lastName := p.Sanitize(get("last_name"))
	dobStr := get("dob")
	nickname := p.Sanitize(get("nickname"))
	about := p.Sanitize(get("about"))
	isPrivate := get("is_private") == "true"

	// Basic validation
	if email == "" || password == "" || firstName == "" || lastName == "" || dobStr == "" || nickname == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	dob, err := time.Parse("2006-01-02", dobStr)
	if err != nil {
		http.Error(w, "Invalid date format (expected YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// validate email and nickname
	query := `
		SELECT
			EXISTS (SELECT 1 FROM users WHERE email = $1) AS email_exists,
			CASE WHEN $2 != '' THEN EXISTS (SELECT 1 FROM users WHERE nickname = $2) ELSE false END AS nickname_exists
	`
	var emailExists, nicknameExists bool
	err = db.DB.QueryRow(query, email, nickname).Scan(&emailExists, &nicknameExists)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	if emailExists {
		http.Error(w, "Email already exists", http.StatusConflict)
		return
	}
	if nicknameExists {
		http.Error(w, "Nickname already exists", http.StatusConflict)
		return
	}

	var userID string
	err = db.DB.QueryRow(`
        INSERT INTO users (email, password, first_name, last_name, dob, nickname, about, is_private)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
    `, email, hashedPassword, firstName, lastName, dob, nickname, nullIfEmpty(about), isPrivate).Scan(&userID)

	if err != nil {
		http.Error(w, "Failed to register user", http.StatusInternalServerError)
		return
	}

	// avatar saving
	avatarPath, err := users.SaveUploadedAvatar(r, userID)
	if err != nil {
		http.Error(w, "Failed to process avatar: "+err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`UPDATE users SET avatar = $1 WHERE id = $2`, avatarPath, userID)
	if err != nil {
		http.Error(w, "Failed to link avatar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	p := bluemonday.StrictPolicy()
	input.Email = p.Sanitize(strings.TrimSpace(input.Email))
	input.Password = strings.TrimSpace(input.Password)

	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		http.Error(w, "Invalid input: "+err.Error(), http.StatusBadRequest)
		return
	}

	var id string
	var hashedPassword string
	err := db.DB.QueryRow(`SELECT id, password FROM users WHERE email = $1`, input.Email).
		Scan(&id, &hashedPassword)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if !auth.CheckPasswordHash(input.Password, hashedPassword) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateJWT(id)
	if err != nil {
		http.Error(w, "Token error", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
}

func Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour), // Invalidate immediately
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true, // Set to true behind HTTPS
		SameSite: http.SameSiteStrictMode,
	})

	w.WriteHeader(http.StatusOK)
}

func nullIfEmpty(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}
