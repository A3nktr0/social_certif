package websocket

import "sync"

type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.send)
			}
			h.mu.Unlock()
		}
	}
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
