package websocket

type Message struct {
	Channel  string                 `json:"channel"`            // e.g., "notifications"
	Event    string                 `json:"event"`              // e.g., "follow_request", "new_message"
	From     *string                `json:"from,omitempty"`     // userID or nil if system
	To       string                 `json:"to"`                 // always target userID
	Content  string                 `json:"content"`            // human-readable text
	Data     map[string]interface{} `json:"data,omitempty"`     // optional metadata
	IsSystem bool                   `json:"isSystem,omitempty"` // to handle UI flagging
}
