package handlers

import (
	"encoding/json"
	"net/http"
	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"time"

	"github.com/go-chi/chi/v5"
)

func GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT n.id, n.type, n.from_user_id, u.nickname, n.content, n.is_read, n.created_at, n.data
		FROM notifications n
		LEFT JOIN users u ON u.id = n.from_user_id
		WHERE n.user_id = $1
		ORDER BY n.created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Notification struct {
		ID         string                 `json:"id"`
		Type       string                 `json:"type"`
		FromUserID string                 `json:"fromUserId"`
		Nickname   string                 `json:"nickname"`
		Content    string                 `json:"content"`
		IsRead     bool                   `json:"isRead"`
		CreatedAt  time.Time              `json:"createdAt"`
		Data       map[string]interface{} `json:"data"`
	}

	var notifications []Notification

	for rows.Next() {
		var n Notification
		var dataBytes []byte

		if err := rows.Scan(
			&n.ID,
			&n.Type,
			&n.FromUserID,
			&n.Nickname,
			&n.Content,
			&n.IsRead,
			&n.CreatedAt,
			&dataBytes,
		); err == nil {
			if len(dataBytes) > 0 {
				json.Unmarshal(dataBytes, &n.Data)
			}
			notifications = append(notifications, n)
		}

	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

func DeleteNotification(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	notificationID := chi.URLParam(r, "id")

	result, err := db.DB.Exec(`
		DELETE FROM notifications
		WHERE id = $1 AND user_id = $2 AND type != 'follow_request'
	`, notificationID, userID)

	if err != nil {
		http.Error(w, "Failed to delete notification", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Notification not found or not deletable", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func MarkNotificationAsRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	notificationID := chi.URLParam(r, "id")

	result, err := db.DB.Exec(`
		UPDATE notifications
		SET is_read = TRUE
		WHERE id = $1 AND user_id = $2 AND is_read = FALSE
	`, notificationID, userID)

	if err != nil {
		http.Error(w, "Failed to mark notification as read", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Notification not found or already read", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func CountUnreadNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var count int
	err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM notifications
		WHERE user_id = $1 AND is_read = FALSE
	`, userID).Scan(&count)

	if err != nil {
		http.Error(w, "Failed to count unread notifications", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]int{"count": count})
}
