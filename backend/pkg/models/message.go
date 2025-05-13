package models

import "time"

type Message struct {
	ID          string    `json:"id"`
	SenderID    string    `json:"sender_id"`
	RecipientID *string   `json:"recipient_id,omitempty"`
	GroupID     *string   `json:"group_id,omitempty"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
}
