package models

import "time"

type Post struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Content    string    `json:"content"`
	Image      string    `json:"image,omitempty"`
	Visibility string    `json:"visibility"` // public, private, custom
	AllowedIDs []string  `json:"allowed_ids,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Like struct {
	UserID    string    `json:"user_id"`
	PostID    string    `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
