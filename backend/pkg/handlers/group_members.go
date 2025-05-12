package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"

	"github.com/go-chi/chi/v5"
)

type GroupMember struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	IsAdmin  bool   `json:"is_admin"`
}

func GetGroupMembers(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")

	var exists bool
	err := db.DB.QueryRow(`SELECT EXISTS (SELECT 1 FROM groups WHERE id = $1)`, groupID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	rows, err := db.DB.Query(`
		SELECT u.id, u.nickname, u.avatar, gm.is_admin
		FROM group_members gm
		JOIN users u ON u.id = gm.user_id
		WHERE gm.group_id = $1
		ORDER BY u.nickname ASC
	`, groupID)
	if err != nil {
		http.Error(w, "Failed to load members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var members []GroupMember
	for rows.Next() {
		var m GroupMember
		if err := rows.Scan(&m.ID, &m.Nickname, &m.Avatar, &m.IsAdmin); err != nil {
			http.Error(w, "Failed to parse members", http.StatusInternalServerError)
			return
		}
		members = append(members, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

func RemoveGroupMember(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	targetUserID := chi.URLParam(r, "userId")
	requesterID := middleware.GetUserID(r)

	isAdmin, err := isGroupAdmin(groupID, requesterID)
	if err != nil || !isAdmin {
		http.Error(w, "Only group admins can remove members", http.StatusForbidden)
		return
	}

	if requesterID == targetUserID {
		http.Error(w, "Admins cannot remove themselves", http.StatusBadRequest)
		return
	}

	var targetIsAdmin bool
	err = db.DB.QueryRow(`
		SELECT is_admin FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, targetUserID).Scan(&targetIsAdmin)
	if err != nil {
		http.Error(w, "User not found in group", http.StatusNotFound)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Remove group membership
	_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, groupID, targetUserID)
	if err != nil {
		http.Error(w, "Failed to remove member", http.StatusInternalServerError)
		return
	}

	// Remove group posts by user
	_, err = tx.Exec(`
		DELETE FROM posts 
		WHERE group_id = $1 AND user_id = $2
	`, groupID, targetUserID)
	if err != nil {
		http.Error(w, "Failed to delete user's group posts", http.StatusInternalServerError)
		return
	}

	// Remove likes by user on group posts
	_, err = tx.Exec(`
		DELETE FROM post_likes 
		WHERE user_id = $1 AND post_id IN (
			SELECT id FROM posts WHERE group_id = $2
		)
	`, targetUserID, groupID)
	if err != nil {
		http.Error(w, "Failed to delete user's likes", http.StatusInternalServerError)
		return
	}

	// Remove comments by user on group posts
	_, err = tx.Exec(`
		DELETE FROM comments 
		WHERE user_id = $1 AND post_id IN (
			SELECT id FROM posts WHERE group_id = $2
		)
	`, targetUserID, groupID)
	if err != nil {
		http.Error(w, "Failed to delete user's comments", http.StatusInternalServerError)
		return
	}

	// clean up their pending invites/requests
	_, _ = tx.Exec(`DELETE FROM group_requests WHERE group_id = $1 AND user_id = $2`, groupID, targetUserID)

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to finalize removal", http.StatusInternalServerError)
		return
	}

	// Clean up related notifications
	_, _ = tx.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND data->>'group_id' = $2
	`, targetUserID, groupID)

	var userName string
	_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, targetUserID).Scan(&userName)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User " + userName + " and all related group content removed",
	})

	// Clean up related events
	_, _ = db.DB.Exec(`
		DELETE FROM events
		WHERE user_id = $1 AND group_id = $2
	`, targetUserID, groupID)
}

// Checks if a given user is an admin in a specific group
func isGroupAdmin(groupID, userID string) (bool, error) {
	var isAdmin bool
	err := db.DB.QueryRow(`
		SELECT is_admin FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, userID).Scan(&isAdmin)

	if err == sql.ErrNoRows {
		return false, nil
	}
	return isAdmin, err
}
