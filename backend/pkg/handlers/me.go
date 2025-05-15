package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
)

func Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var raw struct {
		ID        string         `json:"id"`
		Email     string         `json:"email"`
		FirstName string         `json:"first_name"`
		LastName  string         `json:"last_name"`
		Avatar    sql.NullString `json:"-"`
		Nickname  sql.NullString `json:"-"`
		About     sql.NullString `json:"-"`
		IsPrivate bool           `json:"is_private"`
		Dob       sql.NullTime   `json:"-"`
	}

	err := db.DB.QueryRow(`
		SELECT id, email, first_name, last_name, avatar, nickname, about, is_private, dob
		FROM users
		WHERE id = $1
	`, userID).Scan(
		&raw.ID, &raw.Email, &raw.FirstName, &raw.LastName,
		&raw.Avatar, &raw.Nickname, &raw.About, &raw.IsPrivate, &raw.Dob,
	)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Build response
	response := struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Avatar    string `json:"avatar"`
		Nickname  string `json:"nickname"`
		About     string `json:"about"`
		IsPrivate bool   `json:"is_private"`
		Dob       string `json:"dob"`
	}{
		ID:        raw.ID,
		Email:     raw.Email,
		FirstName: raw.FirstName,
		LastName:  raw.LastName,
		Avatar:    "/static/avatars/default.png", // fallback
		Nickname:  "",
		About:     "",
		IsPrivate: raw.IsPrivate,
		Dob:       "",
	}

	if raw.Avatar.Valid {
		response.Avatar = raw.Avatar.String
	}
	if raw.Nickname.Valid {
		response.Nickname = raw.Nickname.String
	}
	if raw.About.Valid {
		response.About = raw.About.String
	}
	if raw.Dob.Valid {
		response.Dob = raw.Dob.Time.Format("2006-01-02")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeleteMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var avatarPath string
	err := db.DB.QueryRow(`SELECT avatar FROM users WHERE id = $1`, userID).Scan(&avatarPath)
	if err != nil {
		http.Error(w, "Failed to retrieve user avatar", http.StatusInternalServerError)
		return
	}

	_, err = db.DB.Exec(`DELETE FROM users WHERE id = $1`, userID)
	if err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	if avatarPath != "/static/avatars/default.jpg" {
		filePath := strings.Replace(avatarPath, "/static/avatars/", "/uploads/avatars/", 1)

		err = os.Remove("." + filePath) // relative to project root
		if err != nil && !os.IsNotExist(err) {
			http.Error(w, "Failed to delete avatar file", http.StatusInternalServerError)
			return
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusNoContent)
}
