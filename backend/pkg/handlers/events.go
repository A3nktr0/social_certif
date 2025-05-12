package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"socialbackend/pkg/constants"
	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/notifications"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CreateEventRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"event_time"` // ISO 8601 expected
}

func CreateGroupEvent(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Ensure user is a member of the group
	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "You must be a group member to create an event", http.StatusForbidden)
		return
	}

	var req CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Description == "" || req.EventTime.IsZero() {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	eventID := uuid.New().String()
	_, err = db.DB.Exec(`
		INSERT INTO events (id, group_id, creator_id, title, description, event_time)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, eventID, groupID, userID, req.Title, req.Description, req.EventTime)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	// get the group name for notification
	var groupName string
	err = db.DB.QueryRow(`
		SELECT name FROM groups WHERE id = $1
	`, groupID).Scan(&groupName)
	if err != nil {
		http.Error(w, "Failed to fetch group name", http.StatusInternalServerError)
		return
	}

	msg := "created an event in your group " + groupName

	// Notify other group members
	rows, err := db.DB.Query(`
		SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2
	`, groupID, userID)
	if err == nil {
		for rows.Next() {
			var memberID string
			if err := rows.Scan(&memberID); err == nil {
				notifications.Create(memberID, userID, constants.NotifGroupEventCreated,
					msg, map[string]interface{}{
						"group_id": groupID,
						"event_id": eventID,
						"title":    req.Title,
					})
			}
		}
		rows.Close()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Event created",
		"event_id": eventID,
	})
}

func DeleteGroupEvent(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	eventID := chi.URLParam(r, "eventId")
	userID := middleware.GetUserID(r)

	// Ensure the event exists and the user is the creator or an admin
	var isCreator, isAdmin bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM events WHERE id = $1 AND group_id = $2 AND creator_id = $3
		)
	`, eventID, groupID, userID).Scan(&isCreator)
	if err != nil {
		http.Error(w, "Failed to verify creator", http.StatusInternalServerError)
		return
	}

	if !isCreator {
		// Check admin fallback
		err = db.DB.QueryRow(`
			SELECT is_admin FROM group_members WHERE group_id = $1 AND user_id = $2
		`, groupID, userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			http.Error(w, "Only event creator or group admin can delete this event", http.StatusForbidden)
			return
		}
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Delete event
	_, err = tx.Exec(`DELETE FROM events WHERE id = $1 AND group_id = $2`, eventID, groupID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete event", http.StatusInternalServerError)
		return
	}

	_ = tx.Commit()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Event deleted successfully",
	})
}
func GetGroupEvents(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Validate group exists
	var exists bool
	err := db.DB.QueryRow(`SELECT EXISTS (SELECT 1 FROM groups WHERE id = $1)`, groupID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	rows, err := db.DB.Query(`
		SELECT 
			e.id, e.title, e.description, e.event_time, e.creator_id, u.nickname,
			COALESCE(r.response, '') AS rsvp_response
		FROM events e
		JOIN users u ON u.id = e.creator_id
		LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $1
		WHERE e.group_id = $2
		ORDER BY e.event_time ASC
	`, userID, groupID)
	if err != nil {
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Event struct {
		ID          string    `json:"id"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		EventTime   time.Time `json:"event_time"`
		CreatorID   string    `json:"creator_id"`
		CreatorName string    `json:"creator_nickname"`
		RSVP        *string   `json:"user_response"` // going, not_going, or null
	}

	var events []Event
	for rows.Next() {
		var e Event
		var rsvpRaw string
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventTime, &e.CreatorID, &e.CreatorName, &rsvpRaw); err != nil {
			http.Error(w, "Failed to parse event", http.StatusInternalServerError)
			return
		}
		if rsvpRaw == "" {
			e.RSVP = nil
		} else {
			e.RSVP = &rsvpRaw
		}
		events = append(events, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

type RSVPRequest struct {
	Response string `json:"response"` // must be "going" or "not_going"
}

func RSVPEvent(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	eventID := chi.URLParam(r, "eventId")
	userID := middleware.GetUserID(r)

	// Check group membership
	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "Only group members can RSVP", http.StatusForbidden)
		return
	}

	// Parse request body
	var req RSVPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Response != "going" && req.Response != "not_going" {
		http.Error(w, "Response must be 'going' or 'not_going'", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`
		INSERT INTO event_rsvps (event_id, user_id, response)
		VALUES ($1, $2, $3)
		ON CONFLICT (event_id, user_id) DO UPDATE
		SET response = EXCLUDED.response
	`, eventID, userID, req.Response)

	if err != nil {
		http.Error(w, "Failed to save RSVP", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "RSVP recorded",
	})
}
func GetGroupEventDetail(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	eventID := chi.URLParam(r, "eventId")
	userID := middleware.GetUserID(r)

	// Verify group membership
	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Check if user is admin
	// var isAdmin bool
	// _ = db.DB.QueryRow(`
	// 	SELECT is_admin FROM group_members
	// 	WHERE group_id = $1 AND user_id = $2
	// `, groupID, userID).Scan(&isAdmin)

	// Check if user is event creator
	var isCreator bool
	err = db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM events WHERE id = $1 AND group_id = $2 AND creator_id = $3
		)
	`, eventID, groupID, userID).Scan(&isCreator)
	if err != nil {
		http.Error(w, "Failed to verify event creator", http.StatusInternalServerError)
		return
	}

	// Get event info
	var event struct {
		ID          string    `json:"id"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		EventTime   time.Time `json:"event_time"`
		CreatorID   string    `json:"creator_id"`
		CreatedAt   time.Time `json:"created_at"`
		UserRSVP    *string   `json:"user_response,omitempty"`
		// IsAdmin     bool      `json:"is_admin"`
		IsCreator bool `json:"is_creator"`
	}

	err = db.DB.QueryRow(`
		SELECT id, title, description, event_time, creator_id, created_at
		FROM events
		WHERE id = $1 AND group_id = $2
	`, eventID, groupID).Scan(
		&event.ID, &event.Title, &event.Description,
		&event.EventTime, &event.CreatorID, &event.CreatedAt,
	)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Fetch current user's RSVP if exists
	var rsvp sql.NullString
	_ = db.DB.QueryRow(`
		SELECT response FROM event_rsvps
		WHERE event_id = $1 AND user_id = $2
	`, eventID, userID).Scan(&rsvp)

	if rsvp.Valid {
		event.UserRSVP = &rsvp.String
	}

	// event.IsAdmin = isAdmin
	event.IsCreator = isCreator

	// Get RSVP stats
	type RSVPUser struct {
		UserID   string `json:"user_id"`
		Nickname string `json:"nickname"`
		Avatar   string `json:"avatar"`
		Response string `json:"response"`
	}

	rows, err := db.DB.Query(`
		SELECT u.id, u.nickname, u.avatar, r.response
		FROM event_rsvps r
		JOIN users u ON u.id = r.user_id
		WHERE r.event_id = $1
	`, eventID)
	if err != nil {
		http.Error(w, "Failed to load RSVPs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var rsvps []RSVPUser
	for rows.Next() {
		var u RSVPUser
		var avatar sql.NullString
		if err := rows.Scan(&u.UserID, &u.Nickname, &avatar, &u.Response); err == nil {
			u.Avatar = avatar.String
			rsvps = append(rsvps, u)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"event": event,
		"rsvps": rsvps,
	})
}

func UpdateGroupEvent(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	eventID := chi.URLParam(r, "eventId")
	userID := middleware.GetUserID(r)

	// var isAdmin bool
	// err := db.DB.QueryRow(`
	// 	SELECT is_admin FROM group_members
	// 	WHERE group_id = $1 AND user_id = $2
	// `, groupID, userID).Scan(&isAdmin)
	// if err != nil || !isAdmin {
	// 	http.Error(w, "Unauthorized", http.StatusForbidden)
	// 	return
	// }

	// Check if user is event creator
	var isCreator bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM events WHERE id = $1 AND group_id = $2 AND creator_id = $3
		)
	`, eventID, groupID, userID).Scan(&isCreator)
	if err != nil {
		http.Error(w, "Failed to verify event creator", http.StatusInternalServerError)
		return
	}
	if !isCreator {
		http.Error(w, "Only event creator can update this event", http.StatusForbidden)
		return
	}

	var req CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`
		UPDATE events
		SET title = $1, description = $2, event_time = $3
		WHERE id = $4 AND group_id = $5
	`, req.Title, req.Description, req.EventTime, eventID, groupID)
	if err != nil {
		http.Error(w, "Failed to update event", http.StatusInternalServerError)
		return
	}

	var updatedEvent struct {
		ID          string    `json:"id"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		EventTime   time.Time `json:"event_time"`
		CreatedAt   time.Time `json:"created_at"`
	}
	err = db.DB.QueryRow(`
		SELECT id, title, description, event_time, created_at
		FROM events
		WHERE id = $1 AND group_id = $2
	`, eventID, groupID).Scan(&updatedEvent.ID, &updatedEvent.Title, &updatedEvent.Description, &updatedEvent.EventTime, &updatedEvent.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to fetch updated event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"event": updatedEvent})
}
