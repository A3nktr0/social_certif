package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID        int
	Email     string
	Password  string
	FirstName string
	LastName  string
	DOB       time.Time
	Avatar    sql.NullString
	Nickname  sql.NullString
	About     sql.NullString
	IsPrivate bool
}

type UserPersonalData struct {
	GroupList                []string  `json:"group_list"`
	Email                    string    `json:"email"`
	FirstName                string    `json:"first_name"`
	LastName                 string    `json:"last_name"`
	DateOfBirth              time.Time `json:"date_of_birth"`
	Nickname                 string    `json:"nickname,omitempty"`
	About                    string    `json:"about,omitempty"`
	IsPrivate                bool      `json:"is_private"`
	UserCreationDate         time.Time `json:"user_creation_date"`
	NumberOfPosts            int       `json:"nb_posts"`
	PostsList                []string  `json:"posts_published"`
	NumberOfComments         int       `json:"nb_comments"`
	CommentsList             []string  `json:"comments_published"`
	NumberOfMessagesSent     int       `json:"nb_messages_sent"`
	MessagesSent             []string  `json:"messages_sent"`
	NumberOfMessagesReceived int       `json:"nb_messages_received"`
	MessagesReceived         []string  `json:"messages_received"`
	NumberOfPostsLiked       int       `json:"nb_posts_liked"`
	NumberOfEventsCreated    int       `json:"nb_events_created"`
	EventList                []*Event  `json:"eventd_created"`
	NumberOfEventsAccepted   int       `json:"nb_events_accepted"`
	NumberOfEventsRefused    int       `json:"nb_events_refused"`
}

type Event struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}
