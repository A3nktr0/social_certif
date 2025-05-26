package websocket

import (
	"log"
	"strings"
	"sync"

	"socialbackend/pkg/constants"
	"socialbackend/pkg/db"
	"socialbackend/pkg/utils"
)

type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	mu         sync.RWMutex
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.UserID] = client

			allowedClients := utils.GetMutualFollowers(db.DB, client.UserID)

			var nickname string
			_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, client.UserID).Scan(&nickname)

			for _, allowedID := range allowedClients {
				if targetClient, ok := h.clients[allowedID]; ok {
					select {
					case targetClient.send <- Message{
						Channel: constants.ChannelPresence,
						Event:   "user_online",
						From:    &client.UserID,
						To:      allowedID,
						Data: map[string]interface{}{
							"user_id":  client.UserID,
							"nickname": nickname,
							"online":   true,
						},
					}:
					default:
					}
				}
			}

			h.sendPresenceSnapshot(client, allowedClients)

		case client := <-h.unregister:
			if _, ok := h.clients[client.UserID]; ok {
				allowedClients := utils.GetMutualFollowers(db.DB, client.UserID)

				var nickname string
				_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, client.UserID).Scan(&nickname)

				for _, allowedID := range allowedClients {
					if targetClient, ok := h.clients[allowedID]; ok {
						select {
						case targetClient.send <- Message{
							Channel: constants.ChannelPresence,
							Event:   "user_offline",
							From:    &client.UserID,
							To:      allowedID,
							Data: map[string]interface{}{
								"user_id":  client.UserID,
								"nickname": nickname,
								"online":   false,
							},
						}:
						default:
						}
					}
				}

				delete(h.clients, client.UserID)
				close(client.send)
			}

		case msg := <-h.broadcast:
			h.routeMessage(msg)
		}
	}
}

func (h *Hub) routeMessage(msg Message) {
	switch msg.Event {
	case "private_message":
		h.sendPrivateMessage(msg)
	case "group_message":
		h.sendGroupMessage(msg)
	case "typing":
		h.sendTyping(msg)
	case "notification":
		h.sendNotification(msg)
	default:
		log.Println("[WS] Unknown message event:", msg.Event)
	}
}

func (h *Hub) sendPresenceEchoToNewUser(newClient *Client, mutualIDs []string) {
	// (unused now—left intact in case you want to repurpose)
	for _, id := range mutualIDs {
		if mutualClient, ok := h.clients[id]; ok {
			var nickname string
			_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, id).Scan(&nickname)

			select {
			case mutualClient.send <- Message{
				Channel:  constants.ChannelPresence,
				Event:    "user_online",
				From:     &id,
				To:       newClient.UserID,
				IsSystem: true,
				Data: map[string]interface{}{
					"user_id":  id,
					"nickname": nickname,
					"online":   true,
				},
			}:
			default:
				log.Printf("[WS] Failed to echo presence from %s to %s", id, newClient.UserID)
			}
		}
	}
}

func (h *Hub) sendPresenceSnapshot(toClient *Client, mutualIDs []string) {
	for _, id := range mutualIDs {
		if _, ok := h.clients[id]; ok {
			var nickname string
			_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, id).Scan(&nickname)

			select {
			case toClient.send <- Message{
				Channel:  constants.ChannelPresence,
				Event:    "user_online",
				From:     &id,
				To:       toClient.UserID,
				IsSystem: true,
				Data: map[string]interface{}{
					"user_id":  id,
					"nickname": nickname,
					"online":   true,
				},
			}:
			default:
				log.Printf("[WS] Failed to send mutual presence of %s to %s", id, toClient.UserID)
			}
		}
	}
}

func (h *Hub) sendPrivateMessage(msg Message) {
	if msg.From == nil || msg.To == "" || strings.TrimSpace(msg.Content) == "" {
		log.Println("[WS] Invalid private message payload")
		return
	}

	var authorized bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM follows
			WHERE (follower_id = $1 AND followee_id = $2 AND status = 'accepted')
			   OR (follower_id = $2 AND followee_id = $1 AND status = 'accepted')
		)
	`, *msg.From, msg.To).Scan(&authorized)

	if err != nil || !authorized {
		log.Printf("[WS] Unauthorized private message: %s → %s", *msg.From, msg.To)
		return
	}

	_, err = db.DB.Exec(`
		INSERT INTO messages (sender_id, recipient_id, content)
		VALUES ($1, $2, $3)
	`, *msg.From, msg.To, msg.Content)
	if err != nil {
		log.Printf("[WS] Failed to save private message: %v", err)
		return
	}

	var nickname string
	_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, *msg.From).Scan(&nickname)

	msg.Channel = constants.ChannelChat
	msg.Event = "private_message"
	msg.Data = map[string]interface{}{
		"nickname":  nickname,
		"sender_id": *msg.From,
	}
	msg.IsSystem = false

	h.SendToUser(*msg.From, msg)
	h.SendToUser(msg.To, msg)
}

func (h *Hub) sendGroupMessage(msg Message) {
	if msg.GroupID == nil && msg.Data != nil {
		if raw, ok := msg.Data["group_id"]; ok {
			if str, ok := raw.(string); ok && str != "" {
				msg.GroupID = &str
			}
		}
	}

	if msg.From == nil || msg.GroupID == nil || strings.TrimSpace(msg.Content) == "" {
		log.Println("[WS] Invalid group message payload")
		return
	}

	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, *msg.GroupID, *msg.From).Scan(&isMember)

	if err != nil || !isMember {
		log.Printf("[WS] Unauthorized group message: %s → group %s", *msg.From, *msg.GroupID)
		return
	}

	_, err = db.DB.Exec(`
		INSERT INTO messages (sender_id, group_id, content)
		VALUES ($1, $2, $3)
	`, *msg.From, *msg.GroupID, msg.Content)
	if err != nil {
		log.Printf("[WS] DB error saving group message: %v", err)
		return
	}

	var groupName string
	_ = db.DB.QueryRow(`SELECT name FROM groups WHERE id = $1`, *msg.GroupID).Scan(&groupName)

	msg.Channel = constants.ChannelChat
	msg.Event = "group_message"
	msg.Data = map[string]interface{}{
		"group_id":   *msg.GroupID,
		"group_name": groupName,
		"sender_id":  *msg.From,
	}
	msg.IsSystem = false

	rows, err := db.DB.Query(`SELECT user_id FROM group_members WHERE group_id = $1`, *msg.GroupID)
	if err != nil {
		log.Printf("[WS] Failed to fetch group members: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var uid string
		if err := rows.Scan(&uid); err == nil {
			msg.To = uid
			h.SendToUser(uid, msg)
		}
	}
}

func (h *Hub) sendTyping(msg Message) {
	if msg.From == nil || msg.To == "" {
		log.Println("[WS] Invalid typing payload")
		return
	}

	var nickname string
	_ = db.DB.QueryRow(`SELECT nickname FROM users WHERE id = $1`, *msg.From).Scan(&nickname)

	msg.Channel = constants.ChannelChat
	msg.Data = map[string]interface{}{
		"sender_id": *msg.From,
		"nickname":  nickname,
	}

	h.SendToUser(msg.To, msg)
}

func (h *Hub) sendNotification(msg Message) {
	if msg.To == "" {
		log.Println("[WS] Invalid notification payload")
		return
	}
	msg.Channel = constants.ChannelNotifications
	h.SendToUser(msg.To, msg)
}

func (h *Hub) SendToUser(userID string, msg Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.clients[userID]; ok {
		client.send <- msg
	}
}

func (h *Hub) SendToChannel(userID string, channel string, msgType string, from *string, content string, data map[string]interface{}, isSystem bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.clients[userID]; ok {
		client.send <- Message{
			Channel:  channel,
			Event:    msgType,
			From:     from,
			To:       userID,
			Content:  content,
			Data:     data,
			IsSystem: isSystem,
		}
	}
}
