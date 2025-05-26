package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/models"
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
func GetMyPersonalData(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	userDataQuery := `
        SELECT 
            COALESCE(string_agg(DISTINCT gs.name, '<group_delimiter>'), '') AS GROUP_LIST,
            u.email, u.first_name, u.last_name, u.dob AS DATE_OF_BIRTH, 
            u.nickname, u.about, u.is_private, u.created_at AS USER_CREATION_DATE,
            COUNT(DISTINCT p.id) AS NB_POSTS, 
            COALESCE(string_agg(DISTINCT p."content", '<post_delimiter>'), '') AS POSTS_LIST,
            COUNT(DISTINCT c.id) AS NB_COMMENTS, 
            COALESCE(string_agg(DISTINCT c."content", '<comment_delimiter>'), '') AS COMMENTS_LIST,
            COUNT(DISTINCT m.id) AS NB_MESSAGES_SENT, 
            COALESCE(string_agg(DISTINCT m."content", '<message_sent_delimiter>'), '') AS MESSAGES_SENT,
            COUNT(DISTINCT m2.id) AS NB_MESSAGES_RECEIVED, 
            COALESCE(string_agg(DISTINCT m2."content", '<message_received_delimiter>'), '') AS MESSAGES_RECEIVED,
            COUNT(DISTINCT pl.id) AS NB_POSTS_LIKED,
            COUNT(DISTINCT e.id) AS NB_EVENTS_CREATED, 
            COALESCE(string_agg(DISTINCT CONCAT(e.title, '|', e.description), '<event_delimiter>'), '') AS EVENT_DESCRIPTION_LIST,
            COUNT(DISTINCT er.event_id) AS NB_EVENTS_ACCEPTED,
            COUNT(DISTINCT er2.event_id) AS NB_EVENTS_REFUSED
        FROM users u 
        LEFT JOIN group_members gm ON gm.user_id = u.id
        LEFT JOIN groups gs ON gm.group_id = gs.id
        LEFT JOIN posts p ON p.user_id = u.id
        LEFT JOIN "comments" c ON c.user_id = u.id
        LEFT JOIN messages m ON m.sender_id = u.id
        LEFT JOIN messages m2 ON m2.recipient_id = u.id
        LEFT JOIN post_likes pl ON pl.user_id = u.id
        LEFT JOIN events e ON e.creator_id = u.id
        LEFT JOIN event_rsvps er ON er.user_id = u.id AND er.response = 'going'
        LEFT JOIN event_rsvps er2 ON er2.user_id = u.id AND er.response = 'not_going'
        WHERE u.id = $1
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.dob, u.nickname, u.about, u.is_private, u.created_at;
    `
	result := db.DB.QueryRow(userDataQuery, userID)

	var userData models.UserPersonalData

	var groupList, postsList, commentsList, messagesSent, messagesReceived, eventList string

	if err := result.Scan(
		&groupList, &userData.Email, &userData.FirstName, &userData.LastName, &userData.DateOfBirth,
		&userData.Nickname, &userData.About, &userData.IsPrivate, &userData.UserCreationDate,
		&userData.NumberOfPosts, &postsList, &userData.NumberOfComments, &commentsList,
		&userData.NumberOfMessagesSent, &messagesSent, &userData.NumberOfMessagesReceived, &messagesReceived,
		&userData.NumberOfPostsLiked, &userData.NumberOfEventsCreated, &eventList,
		&userData.NumberOfEventsAccepted, &userData.NumberOfEventsRefused,
	); err != nil {
		fmt.Println("Error fetching user data:", err)
		http.Error(w, "Failed to gather user's personal data", http.StatusInternalServerError)
		return
	}

	// Handle empty string cases
	if groupList != "" {
		userData.GroupList = strings.Split(groupList, "<group_delimiter>")
	} else {
		userData.GroupList = []string{}
	}

	if postsList != "" {
		userData.PostsList = strings.Split(postsList, "<post_delimiter>")
	} else {
		userData.PostsList = []string{}
	}

	if commentsList != "" {
		userData.CommentsList = strings.Split(commentsList, "<comment_delimiter>")
	} else {
		userData.CommentsList = []string{}
	}

	if messagesSent != "" {
		userData.MessagesSent = strings.Split(messagesSent, "<message_sent_delimiter>")
	} else {
		userData.MessagesSent = []string{}
	}

	if messagesReceived != "" {
		userData.MessagesReceived = strings.Split(messagesReceived, "<message_received_delimiter>")
	} else {
		userData.MessagesReceived = []string{}
	}

	// Handle event list
	userData.EventList = []*models.Event{}
	if eventList != "" {
		eventArray := strings.Split(eventList, "<event_delimiter>")
		for _, event := range eventArray {
			eventSplitted := strings.Split(event, "|")
			if len(eventSplitted) >= 2 {
				var eventStruct models.Event
				eventStruct.Title = eventSplitted[0]
				eventStruct.Content = eventSplitted[1]
				userData.EventList = append(userData.EventList, &eventStruct)
			}
		}
	}

	respJson, err := json.Marshal(&userData)
	if err != nil {
		http.Error(w, "Failed to marshal user's personal data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(respJson)
}
