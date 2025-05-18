package handlers

import (
	"net/http"
	"socialbackend/pkg/auth"
	"socialbackend/pkg/db"
	"socialbackend/pkg/helpers"
	"socialbackend/pkg/utils"
)

func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ParseJWTFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = utils.DeleteImageFromTable(
		db.DB,
		"users",
		"id",
		claims.UserID,
		claims.UserID,
		"avatar",
		"/static/avatars/",
		"/uploads/avatars/",
		"default.jpg",
	)
	if err != nil {
		http.Error(w, "Failed to delete old avatar", http.StatusInternalServerError)
		return
	}

	newAvatarPath, err := helpers.SaveUploadedAvatar(r, claims.UserID)
	if err != nil {
		http.Error(w, "Failed to save avatar: "+err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`UPDATE users SET avatar = $1 WHERE id = $2`, newAvatarPath, claims.UserID)
	if err != nil {
		http.Error(w, "Could not update avatar path", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
