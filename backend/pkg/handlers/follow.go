package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"socialbackend/pkg/constants"
	"socialbackend/pkg/db"
	"socialbackend/pkg/helpers"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/models"

	"github.com/go-chi/chi/v5"
)

func FollowUser(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r)
	followeeID := strings.TrimSpace(chi.URLParam(r, "id"))

	if followerID == followeeID {
		http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
		return
	}

	var isPrivate bool
	err := db.DB.QueryRow(`SELECT is_private FROM users WHERE id = $1`, followeeID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Determine intended follow status
	var newStatus models.FollowStatus
	notifType := constants.NotifFollow
	notifContent := "You have a new follower."

	if isPrivate {
		newStatus = models.StatusPending
		notifType = constants.NotifFollowRequest
		notifContent = "sent you a follow request."
	} else {
		newStatus = models.StatusAccepted
	}

	// Get existing status if any
	var existingStatus models.FollowStatus
	err = db.DB.QueryRow(`
		SELECT status FROM follows
		WHERE follower_id = $1 AND followee_id = $2
	`, followerID, followeeID).Scan(&existingStatus)

	switch {
	case err == sql.ErrNoRows:
		// Insert new relationship
		_, err = db.DB.Exec(`
			INSERT INTO follows (follower_id, followee_id, status)
			VALUES ($1, $2, $3)
		`, followerID, followeeID, newStatus)

		if err != nil {
			http.Error(w, "Follow failed", http.StatusInternalServerError)
			return
		}

		helpers.Create(followeeID, followerID, notifType, notifContent, nil)

	case err == nil && existingStatus != newStatus:
		// Prevent auto-accept from pending
		if !(existingStatus == models.StatusPending && newStatus == models.StatusAccepted) {
			_, err = db.DB.Exec(`
				UPDATE follows SET status = $3
				WHERE follower_id = $1 AND followee_id = $2
			`, followerID, followeeID, newStatus)

			if err != nil {
				http.Error(w, "Failed to update follow", http.StatusInternalServerError)
				return
			}

			helpers.Create(followeeID, followerID, notifType, notifContent, nil)
		}

	case err != nil:
		http.Error(w, "Failed to check follow status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func FollowStatus(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r)
	followeeID := strings.TrimSpace(chi.URLParam(r, "id"))

	var status string
	err := db.DB.QueryRow(`
		SELECT status FROM follows
		WHERE follower_id = $1 AND followee_id = $2
	`, followerID, followeeID).Scan(&status)

	if err == sql.ErrNoRows {
		status = "none"
	} else if err != nil {
		http.Error(w, "Error checking status", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"status": status,
	})
}

func UnfollowUser(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r)
	followeeID := strings.TrimSpace(chi.URLParam(r, "id"))

	// Start transaction
	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Delete follow record
	_, err = tx.Exec(`
		DELETE FROM follows
		WHERE follower_id = $1 AND followee_id = $2
	`, followerID, followeeID)
	if err != nil {
		http.Error(w, "Failed to unfollow", http.StatusInternalServerError)
		return
	}

	// Remove follower from allowed_ids[] in followee's posts
	_, err = tx.Exec(`
		UPDATE posts
		SET allowed_ids = array_remove(allowed_ids, $1)
		WHERE user_id = $2 AND $1 = ANY(allowed_ids)
	`, followerID, followeeID)
	if err != nil {
		http.Error(w, "Failed to clean up selected access", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit unfollow", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func AcceptFollowRequest(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)
	followerID := strings.TrimSpace(chi.URLParam(r, "id"))

	result, err := db.DB.Exec(`
		UPDATE follows
		SET status = $3
		WHERE follower_id = $1 AND followee_id = $2 AND status = $4
	`, followerID, currentUserID, models.StatusAccepted, models.StatusPending)

	if err != nil {
		http.Error(w, "Failed to accept request", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No pending request found", http.StatusBadRequest)
		return
	}

	// Notify the follower
	helpers.Create(followerID, currentUserID, constants.NotifFollowAccepted, "Your follow request was accepted.", nil)

	_, err = db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
	`, currentUserID, followerID, constants.NotifFollowRequest)

	if err != nil {
		http.Error(w, "Failed to delete notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func RejectFollowRequest(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)
	followerID := strings.TrimSpace(chi.URLParam(r, "id"))

	result, err := db.DB.Exec(`
		DELETE FROM follows
		WHERE follower_id = $1 AND followee_id = $2 AND status = $3
	`, followerID, currentUserID, models.StatusPending)

	if err != nil {
		http.Error(w, "Failed to reject follow request", http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "No pending request found", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
	`, currentUserID, followerID, constants.NotifFollowRequest)

	if err != nil {
		http.Error(w, "Failed to delete notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func ListFollowers(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT 
			u.id, u.first_name, u.last_name, u.avatar, u.nickname,
			EXISTS (
				SELECT 1 FROM follows 
				WHERE follower_id = $1 AND followee_id = u.id AND status = 'accepted'
			) AS is_following
		FROM follows f
		JOIN users u ON u.id = f.follower_id
		WHERE f.followee_id = $1 AND f.status = $2
	`, currentUserID, models.StatusAccepted)
	if err != nil {
		http.Error(w, "Failed to fetch followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type FollowerWithStatus struct {
		ID          string `json:"id"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		Avatar      string `json:"avatar"`
		Nickname    string `json:"nickname"`
		IsFollowing bool   `json:"is_following"`
	}

	var followers []FollowerWithStatus
	for rows.Next() {
		var u FollowerWithStatus
		var avatar sql.NullString
		var nickname sql.NullString

		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &avatar, &nickname, &u.IsFollowing); err != nil {
			http.Error(w, "Error parsing result", http.StatusInternalServerError)
			return
		}
		u.Avatar = avatar.String
		if !avatar.Valid || u.Avatar == "" {
			u.Avatar = "/static/avatars/default.jpg"
		}
		u.Nickname = nickname.String

		followers = append(followers, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(followers)
}

type FollowRequestUser struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Avatar    string `json:"avatar"`
	Nickname  string `json:"nickname"`
}

func ListFollowingUsers(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname
		FROM follows f
		JOIN users u ON u.id = f.followee_id
		WHERE f.follower_id = $1 AND f.status = $2
	`, currentUserID, models.StatusAccepted)
	if err != nil {
		http.Error(w, "Failed to fetch following", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var following []FollowRequestUser
	for rows.Next() {
		var u FollowRequestUser
		var avatar sql.NullString
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &avatar, &u.Nickname); err != nil {
			http.Error(w, "Error parsing result", http.StatusInternalServerError)
			return
		}
		u.Avatar = avatar.String
		if !avatar.Valid || u.Avatar == "" {
			u.Avatar = "/static/avatars/default.jpg"
		}
		following = append(following, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(following)
}

// GET /follow/stats
func FollowStats(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var followers, following int
	err := db.DB.QueryRow(`SELECT COUNT(*) FROM follows WHERE followee_id = $1 AND status = 'accepted'`, userID).Scan(&followers)
	if err != nil {
		http.Error(w, "Failed to count followers", http.StatusInternalServerError)
		return
	}
	err = db.DB.QueryRow(`SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND status = 'accepted'`, userID).Scan(&following)
	if err != nil {
		http.Error(w, "Failed to count following", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]int{
		"followers": followers,
		"following": following,
	})
}
