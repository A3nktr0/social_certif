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
		SELECT string_agg(DISTINCT name, '<group_delimiter>') AS GROUP_LIST, 
			u.email, u.first_name, u.last_name, u.dob AS DATE_OF_BIRTH, u.nickname, u.about, u.is_private, u.created_at AS USER_CREATION_DATE,
			COUNT(DISTINCT p.id) AS NB_POSTS, string_agg(DISTINCT p."content", '<post_delimiter>') AS POSTS_LIST,
			COUNT(DISTINCT c.id) AS NB_COMMENTS, string_agg(DISTINCT c."content", '<comment_delimiter>') AS COMMENTS_LIST,
			COUNT(DISTINCT m.id) AS NB_MESSAGES_SENT, string_agg(DISTINCT m."content", '<message_sent_delimiter>') AS MESSAGES_SENT,
			COUNT(DISTINCT m2.id) AS NB_MESSAGES_RECEIVED, string_agg(DISTINCT m2."content", '<message_received_delimiter>') AS MESSAGES_RECEIVED,
			COUNT(DISTINCT pl.id) AS NB_POSTS_LIKED, 
			COUNT(DISTINCT e.id) AS NB_EVENTS_CREATED, string_agg(DISTINCT CONCAT(e.title , '|',  e.description), '<event_delimiter>') AS EVENT_DESCRIPTION_LIST,
			COUNT(DISTINCT er.event_id) AS NB_EVENTS_ACCEPTED,
			COUNT(DISTINCT er2.event_id) AS NB_EVENTS_REFUSED
				FROM users u 
					JOIN group_members gm ON gm.user_id = u.id
					JOIN groups gs ON gm.group_id = gs.id
					JOIN posts p ON p.user_id = u.id
					JOIN "comments" c ON c.user_id = u.id
					JOIN messages m ON m.sender_id = u.id
					JOIN messages m2 ON m2.recipient_id = u.id
					JOIN post_likes pl ON pl.user_id = u.id
					JOIN events e ON e.creator_id = u.id
					JOIN event_rsvps er ON er.user_id = u.id AND er.response = 'going'
					JOIN event_rsvps er2 ON er2.user_id = u.id AND er2.response = 'not_going'
					WHERE u.id = $1
			GROUP BY u.id, u.email, u.first_name, u.last_name, u.dob, u.nickname, u.about, u.is_private, u.created_at, p.user_id;
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
		fmt.Println(err)
		http.Error(w, "Failed to gather user's personal data", http.StatusInternalServerError)
		return
	}
	userData.CommentsList = strings.Split(commentsList, "<comment_delimiter>")
	userData.GroupList = strings.Split(groupList, "<group_delimiter>")
	userData.PostsList = strings.Split(postsList, "<post_delimiter>")
	userData.MessagesSent = strings.Split(messagesSent, "<message_sent_delimiter>")
	userData.MessagesReceived = strings.Split(messagesReceived, "<message_received_delimiter>")
	eventArray := strings.Split(eventList, "<event_delimiter>")
	var events []*models.Event
	for _, event := range eventArray {
		var eventStruct models.Event
		eventSplitted := strings.Split(event, "|")
		eventStruct.Title = eventSplitted[0]
		eventStruct.Content = eventSplitted[1]
		events = append(events, &eventStruct)
	}
	userData.EventList = events

	respJson, err := json.Marshal(&userData)
	if err != nil {
		http.Error(w, "Failed to gather user's personal data", http.StatusInternalServerError)
		return
	}

	w.Write(respJson)
}
