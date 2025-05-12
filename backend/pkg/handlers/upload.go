package handlers

import (
	"net/http"
	"socialbackend/pkg/auth"
	"socialbackend/pkg/db"
	"socialbackend/pkg/users"
)

func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ParseJWTFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	avatarPath, err := users.SaveUploadedAvatar(r, claims.UserID)
	if err != nil {
		http.Error(w, "Failed to save avatar: "+err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`UPDATE users SET avatar = $1 WHERE id = $2`, avatarPath, claims.UserID)
	if err != nil {
		http.Error(w, "Could not update avatar path", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
