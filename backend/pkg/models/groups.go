package models

type Group struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Avatar      string `json:"avatar"`
	CreatorID   string `json:"creator_id"`
	CreatedAt   string `json:"created_at"`
}

type GroupMember struct {
	GroupID string `json:"group_id"`
	UserID  string `json:"user_id"`
	IsAdmin bool   `json:"is_admin"`
}

type GroupRequest struct {
	GroupID string `json:"group_id"`
	UserID  string `json:"user_id"`
	Status  string `json:"status"`
}
