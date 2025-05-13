package websocket

type Message struct {
	Channel  string                 `json:"channel"`
	Event    string                 `json:"event"`
	From     *string                `json:"from,omitempty"`
	To       string                 `json:"to"` // always target user ID
	GroupID  *string                `json:"groupId,omitempty"`
	Content  string                 `json:"content"`
	Data     map[string]interface{} `json:"data,omitempty"`
	IsSystem bool                   `json:"isSystem,omitempty"`
}
