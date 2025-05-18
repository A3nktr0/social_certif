package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"socialbackend/pkg/constants"
	"socialbackend/pkg/db"
	"socialbackend/pkg/helpers"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/microcosm-cc/bluemonday"
)

type CreateGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Avatar      string `json:"avatar,omitempty"`
}

func CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	rawName := strings.TrimSpace(r.FormValue("name"))
	rawDesc := strings.TrimSpace(r.FormValue("description"))

	if rawName == "" {
		http.Error(w, "Group name is required", http.StatusBadRequest)
		return
	}

	// Sanitize using bluemonday
	policy := bluemonday.StrictPolicy()
	name := policy.Sanitize(rawName)
	description := policy.Sanitize(rawDesc)

	// Handle avatar upload
	var avatarURL string
	file, handler, err := r.FormFile("avatar")
	if err == nil && file != nil {
		defer file.Close()

		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil {
			http.Error(w, "Could not read file header", http.StatusBadRequest)
			return
		}
		contentType := http.DetectContentType(buffer)
		if !strings.HasPrefix(contentType, "image/") {
			http.Error(w, "Invalid avatar content type", http.StatusBadRequest)
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			http.Error(w, "Failed to reset file reader", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			http.Error(w, "Invalid avatar file extension", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll("uploads/groups", os.ModePerm); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		filename := "group_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/groups", filename)

		out, err := os.Create(savePath)
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to write avatar", http.StatusInternalServerError)
			return
		}

		avatarURL = "/static/groups/" + filename
	}

	groupID := uuid.New().String()

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Could not start transaction", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`
		INSERT INTO groups (id, name, description, avatar, creator_id)
		VALUES ($1, $2, $3, $4, $5)
	`, groupID, name, description, avatarURL, userID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`
		INSERT INTO group_members (group_id, user_id, is_admin)
		VALUES ($1, $2, true)
	`, groupID, userID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to assign admin", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Transaction commit failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"group_id": groupID,
		"message":  "Group created",
	})
}

func DeleteGroup(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var creatorID string
	err := db.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = $1`, groupID).Scan(&creatorID)
	if err == sql.ErrNoRows {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if creatorID != userID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	err = utils.DeleteImageFromTable(
		db.DB,
		"groups",
		"id",
		groupID,
		userID,
		"avatar",
		"/static/groups/",
		"/uploads/groups/",
		"default.jpg",
	)
	if err != nil {
		http.Error(w, "Failed to delete group avatar", http.StatusInternalServerError)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Transaction error", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`DELETE FROM groups WHERE id = $1`, groupID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete group", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Commit failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateGroup(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var existingAvatar, creatorID string
	err := db.DB.QueryRow(`SELECT avatar, creator_id FROM groups WHERE id = $1`, groupID).Scan(&existingAvatar, &creatorID)
	if err == sql.ErrNoRows {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if creatorID != userID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	rawName := strings.TrimSpace(r.FormValue("name"))
	rawDesc := strings.TrimSpace(r.FormValue("description"))
	deleteAvatar := r.FormValue("delete_avatar") == "true"

	if rawName == "" {
		http.Error(w, "Group name is required", http.StatusBadRequest)
		return
	}

	// Sanitize input
	policy := bluemonday.StrictPolicy()
	name := policy.Sanitize(rawName)
	description := policy.Sanitize(rawDesc)

	const defaultAvatar = "/static/avatars/default.jpg"
	var newAvatar string

	// Handle optional avatar upload
	file, handler, err := r.FormFile("avatar")
	if err == nil && file != nil {
		defer file.Close()

		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil {
			http.Error(w, "Could not read avatar header", http.StatusBadRequest)
			return
		}
		if !strings.HasPrefix(http.DetectContentType(buffer), "image/") {
			http.Error(w, "Invalid image format", http.StatusBadRequest)
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			http.Error(w, "Failed to reset file reader", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			http.Error(w, "Unsupported avatar file extension", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll("uploads/groups", os.ModePerm); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		filename := "group_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/groups", filename)
		out, err := os.Create(savePath)
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to write avatar", http.StatusInternalServerError)
			return
		}

		newAvatar = "/static/groups/" + filename
	}

	// Determine what the final avatar should be
	finalAvatar := existingAvatar
	if deleteAvatar {
		finalAvatar = defaultAvatar
	}
	if newAvatar != "" {
		finalAvatar = newAvatar
	}

	// Update group in DB
	_, err = db.DB.Exec(`UPDATE groups SET name = $1, description = $2, avatar = $3 WHERE id = $4`,
		name, description, finalAvatar, groupID)
	if err != nil {
		http.Error(w, "Update failed", http.StatusInternalServerError)
		return
	}

	// If avatar changed or deleted, remove old file (if not default)
	if (deleteAvatar || newAvatar != "") && existingAvatar != "" && existingAvatar != defaultAvatar {
		_ = utils.DeleteImageFromTable(
			db.DB,
			"groups",
			"id",
			groupID,
			userID,
			"avatar",
			"/static/groups/",
			"/uploads/groups/",
			"default.jpg",
		)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Group updated"})
}

func ListUserGroups(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT g.id, g.name, g.description, g.avatar, g.creator_id, g.created_at, gm.is_admin
		FROM group_members gm
		JOIN groups g ON g.id = gm.group_id
		WHERE gm.user_id = $1
	`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type GroupInfo struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar,omitempty"`
		CreatorID   string `json:"creator_id"`
		CreatedAt   string `json:"created_at"`
		IsAdmin     bool   `json:"is_admin"`
	}

	var groups []GroupInfo
	for rows.Next() {
		var g GroupInfo
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.Avatar, &g.CreatorID, &g.CreatedAt, &g.IsAdmin); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		groups = append(groups, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func GetGroupByID(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var group struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar"`
		CreatorID   string `json:"creator_id"`
		CreatedAt   string `json:"created_at"`
	}
	err := db.DB.QueryRow(`
		SELECT id, name, description, avatar, creator_id, created_at
		FROM groups
		WHERE id = $1
	`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.Avatar, &group.CreatorID, &group.CreatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching group", http.StatusInternalServerError)
		return
	}

	// Determine membership
	var isMember, isAdmin bool
	err = db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil {
		http.Error(w, "Error checking membership", http.StatusInternalServerError)
		return
	}

	if isMember {
		err = db.DB.QueryRow(`
			SELECT is_admin FROM group_members
			WHERE group_id = $1 AND user_id = $2
		`, groupID, userID).Scan(&isAdmin)
		if err != nil {
			http.Error(w, "Error checking admin status", http.StatusInternalServerError)
			return
		}
	}

	response := map[string]interface{}{
		"id":          group.ID,
		"name":        group.Name,
		"description": group.Description,
		"avatar":      group.Avatar,
		"creator_id":  group.CreatorID,
		"created_at":  group.CreatedAt,
		"is_member":   isMember,
		"is_admin":    isAdmin,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DiscoverGroups(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT g.id, g.name, g.description, g.avatar, g.creator_id, g.created_at
		FROM groups g
		WHERE g.id NOT IN (
			SELECT group_id FROM group_members WHERE user_id = $1
		)
	`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type GroupPreview struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar,omitempty"`
		CreatorID   string `json:"creator_id"`
		CreatedAt   string `json:"created_at"`
	}

	var groups []GroupPreview
	for rows.Next() {
		var g GroupPreview
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.Avatar, &g.CreatorID, &g.CreatedAt); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		groups = append(groups, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func RequestToJoinGroup(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if isMember {
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Already a member",
		})
		return
	}

	var status string
	err = db.DB.QueryRow(`
		SELECT status FROM group_requests WHERE group_id = $1 AND user_id = $2
	`, groupID, userID).Scan(&status)

	switch {
	case err == sql.ErrNoRows:
		_, err = db.DB.Exec(`
			INSERT INTO group_requests (group_id, user_id, status)
			VALUES ($1, $2, 'pending')
		`, groupID, userID)
		if err != nil {
			http.Error(w, "Could not request to join", http.StatusInternalServerError)
			return
		}

		// Get group creator for notification
		var creatorID string
		_ = db.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = $1`, groupID).Scan(&creatorID)

		helpers.Create(creatorID, userID, constants.NotifGroupJoinRequest, "requested to join your group", map[string]interface{}{
			"group_id": groupID,
			"user_id":  userID,
		})

		json.NewEncoder(w).Encode(map[string]string{
			"message": "Join request sent",
		})
		return

	case err == nil && status == "invited":
		json.NewEncoder(w).Encode(map[string]string{
			"message": "You have already been invited. Please accept the invitation.",
		})
		return

	case err == nil && status == "pending":
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Join request already pending",
		})
		return

	default:
		http.Error(w, "Server error", http.StatusInternalServerError)
	}
}

func InviteUserToGroup(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	targetUserID := chi.URLParam(r, "userId")
	senderID := middleware.GetUserID(r)

	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, senderID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "Only group members can invite others", http.StatusForbidden)
		return
	}

	// Check that the sender is following the target user
	var follows bool
	err = db.DB.QueryRow(`
	SELECT EXISTS (
		SELECT 1 FROM follows
		WHERE follower_id = $1 AND followee_id = $2 AND status = 'accepted'
	)
`, senderID, targetUserID).Scan(&follows)
	if err != nil || !follows {
		http.Error(w, "You can only invite users you follow", http.StatusForbidden)
		return
	}

	// Check if the target user is already a member
	var targetIsMember bool
	_ = db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, targetUserID).Scan(&targetIsMember)
	if targetIsMember {
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User is already a member",
		})
		return
	}

	// Prevent duplicate invites
	var exists bool
	_ = db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_requests WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, targetUserID).Scan(&exists)
	if exists {
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User has already been invited or requested to join",
		})
		return
	}

	// Insert the invitation
	_, err = db.DB.Exec(`
		INSERT INTO group_requests (group_id, user_id, status)
		VALUES ($1, $2, 'invited')
	`, groupID, targetUserID)
	if err != nil {
		http.Error(w, "Failed to invite user", http.StatusInternalServerError)
		return
	}

	// Get group name for notification
	var groupName string
	_ = db.DB.QueryRow(`
		SELECT name FROM groups WHERE id = $1
	`, groupID).Scan(&groupName)
	if groupName == "" {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	msg := "invited you to join the group " + groupName

	// Send WebSocket notification
	helpers.Create(targetUserID, senderID, constants.NotifGroupInvite, msg, map[string]interface{}{
		"group_id": groupID,
	})

	json.NewEncoder(w).Encode(map[string]string{
		"message": "User invited successfully",
	})
}

func GetInvitableUsers(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	currentUserID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname
		FROM follows f
		JOIN users u ON u.id = f.followee_id
		WHERE f.follower_id = $1
		AND f.status = 'accepted'
		AND u.id NOT IN (
			SELECT user_id FROM group_members WHERE group_id = $2
		)
		AND u.id NOT IN (
			SELECT user_id FROM group_requests WHERE group_id = $2
		)
	`, currentUserID, groupID)

	if err != nil {
		http.Error(w, "Failed to fetch invitable users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type User struct {
		ID        string `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Nickname  string `json:"nickname"`
		Avatar    string `json:"avatar"`
	}

	var users []User

	for rows.Next() {
		var u User
		var avatar sql.NullString
		var nickname sql.NullString

		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &avatar, &nickname); err != nil {
			http.Error(w, "Error parsing user data", http.StatusInternalServerError)
			return
		}

		u.Avatar = avatar.String
		if !avatar.Valid || u.Avatar == "" {
			u.Avatar = "/static/avatars/default.jpg"
		}
		u.Nickname = nickname.String

		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func AcceptJoinRequest(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	requestedUserID := chi.URLParam(r, "userId")
	creatorID := middleware.GetUserID(r)

	// Verify that current user is group creator
	var isCreator bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM groups WHERE id = $1 AND creator_id = $2
		)
	`, groupID, creatorID).Scan(&isCreator)
	if err != nil || !isCreator {
		http.Error(w, "Only the group creator can approve join requests", http.StatusForbidden)
		return
	}

	// Check if a pending request exists
	var status string
	err = db.DB.QueryRow(`
		SELECT status FROM group_requests
		WHERE group_id = $1 AND user_id = $2
	`, groupID, requestedUserID).Scan(&status)

	if err == sql.ErrNoRows || status != "pending" {
		http.Error(w, "No pending join request from this user", http.StatusBadRequest)
		return
	}

	tx, _ := db.DB.Begin()
	_, err1 := tx.Exec(`DELETE FROM group_requests WHERE group_id = $1 AND user_id = $2`, groupID, requestedUserID)
	_, err2 := tx.Exec(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, groupID, requestedUserID)

	if err1 != nil || err2 != nil {
		tx.Rollback()
		http.Error(w, "Failed to accept join request", http.StatusInternalServerError)
		return
	}
	tx.Commit()

	helpers.Create(requestedUserID, creatorID, constants.NotifGroupJoinAccepted, "Your join request was accepted", map[string]interface{}{
		"group_id": groupID,
		"user_id":  requestedUserID,
	})

	// Cleanup the original join request notification
	db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
`, creatorID, requestedUserID, constants.NotifGroupJoinRequest)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User has been added to the group",
	})
}

func RejectJoinRequest(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	requestedUserID := chi.URLParam(r, "userId")
	creatorID := middleware.GetUserID(r)

	// Verify that current user is group creator
	var isCreator bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM groups WHERE id = $1 AND creator_id = $2
		)
	`, groupID, creatorID).Scan(&isCreator)
	if err != nil || !isCreator {
		http.Error(w, "Only the group creator can reject join requests", http.StatusForbidden)
		return
	}

	// Check if a pending request exists
	var status string
	err = db.DB.QueryRow(`
		SELECT status FROM group_requests
		WHERE group_id = $1 AND user_id = $2
	`, groupID, requestedUserID).Scan(&status)

	if err == sql.ErrNoRows || status != "pending" {
		http.Error(w, "No pending join request from this user", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`
		DELETE FROM group_requests WHERE group_id = $1 AND user_id = $2
	`, groupID, requestedUserID)
	if err != nil {
		http.Error(w, "Failed to reject join request", http.StatusInternalServerError)
		return
	}

	helpers.Create(requestedUserID, creatorID, constants.NotifGroupJoinRejected, "Your join request was rejected", map[string]interface{}{
		"group_id": groupID,
		"user_id":  requestedUserID,
	})

	db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
`, creatorID, requestedUserID, constants.NotifGroupJoinRequest)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Join request rejected",
	})
}

func AcceptInvite(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Check if invitation exists
	var status string
	err := db.DB.QueryRow(`
		SELECT status FROM group_requests
		WHERE group_id = $1 AND user_id = $2
	`, groupID, userID).Scan(&status)

	if err == sql.ErrNoRows || status != "invited" {
		http.Error(w, "No invitation found", http.StatusBadRequest)
		return
	}

	tx, _ := db.DB.Begin()
	_, err1 := tx.Exec(`DELETE FROM group_requests WHERE group_id = $1 AND user_id = $2`, groupID, userID)
	_, err2 := tx.Exec(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, groupID, userID)

	if err1 != nil || err2 != nil {
		tx.Rollback()
		http.Error(w, "Failed to accept invitation", http.StatusInternalServerError)
		return
	}
	tx.Commit()

	// Get group creator
	var creatorID string
	_ = db.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = $1`, groupID).Scan(&creatorID)

	helpers.Create(creatorID, userID, constants.NotifGroupInviteAccepted, "accepted your group invitation", map[string]interface{}{
		"group_id": groupID,
	})

	// Delete original invite notification
	db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
`, userID, creatorID, constants.NotifGroupInvite)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "You have joined the group",
	})
}

func RejectInvite(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Check if invitation exists
	var status string
	err := db.DB.QueryRow(`
		SELECT status FROM group_requests
		WHERE group_id = $1 AND user_id = $2
	`, groupID, userID).Scan(&status)

	if err == sql.ErrNoRows || status != "invited" {
		http.Error(w, "No invitation found", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`
		DELETE FROM group_requests WHERE group_id = $1 AND user_id = $2
	`, groupID, userID)
	if err != nil {
		http.Error(w, "Failed to reject invitation", http.StatusInternalServerError)
		return
	}

	var creatorID string
	_ = db.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = $1`, groupID).Scan(&creatorID)

	helpers.Create(creatorID, userID, constants.NotifGroupInviteRejected, "rejected your group invitation", map[string]interface{}{
		"group_id": groupID,
	})

	db.DB.Exec(`
		DELETE FROM notifications
		WHERE user_id = $1 AND from_user_id = $2 AND type = $3
`, userID, creatorID, constants.NotifGroupInvite)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Invitation rejected",
	})
}
