package handlers

import (
	"encoding/json"
	"net/http"
	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/models"
	"socialbackend/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/lib/pq"
)

type MutualUser struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
}

func GetMutualChatUsers(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Reuse your existing function to get mutual IDs
	ids := utils.GetMutualFollowers(db.DB, userID)
	if len(ids) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]MutualUser{})
		return
	}

	query := `
		SELECT id, nickname, first_name, avatar
		FROM users
		WHERE id = ANY($1)
	`

	rows, err := db.DB.Query(query, pq.Array(ids))
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []MutualUser
	for rows.Next() {
		var u MutualUser
		err := rows.Scan(&u.ID, &u.Nickname, &u.Name, &u.Avatar)
		if err == nil {
			users = append(users, u)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func GetPrivateMessages(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	targetID := chi.URLParam(r, "id")
	before := r.URL.Query().Get("before")

	query := `
		SELECT id, sender_id, recipient_id, content, created_at
		FROM messages
		WHERE 
			((recipient_id = $1 AND sender_id = $2) OR
			(recipient_id = $2 AND sender_id = $1))
	`
	args := []interface{}{userID, targetID}

	if before != "" {
		query += ` AND created_at < $3`
		args = append(args, before)
	}

	query += ` ORDER BY created_at DESC LIMIT 30`

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to load messages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		err := rows.Scan(&m.ID, &m.SenderID, &m.RecipientID, &m.Content, &m.CreatedAt)
		if err == nil {
			messages = append(messages, m)
		}
	}

	// Reverse to chronological order (ASC)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
func GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	groupID := chi.URLParam(r, "id")
	before := r.URL.Query().Get("before")

	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "Not a member of this group", http.StatusForbidden)
		return
	}

	query := `
		SELECT id, sender_id, group_id, content, created_at
		FROM messages
		WHERE group_id = $1
	`
	args := []interface{}{groupID}

	if before != "" {
		query += ` AND created_at < $2`
		args = append(args, before)
	}

	query += ` ORDER BY created_at DESC LIMIT 30`

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to load group messages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		err := rows.Scan(&m.ID, &m.SenderID, &m.GroupID, &m.Content, &m.CreatedAt)
		if err == nil {
			messages = append(messages, m)
		}
	}

	// Reverse to ASC
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
