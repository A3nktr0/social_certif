package websocket

import (
	"log"
	"net/http"

	"socialbackend/pkg/middleware"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Replace in production with strict domain checking
		return true
	},
}

func ServeWS(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	client := &Client{
		UserID: userID,
		conn:   conn,
		send:   make(chan Message),
	}

	GlobalHub.register <- client

	go client.WritePump()
	go client.ReadPump()
}
