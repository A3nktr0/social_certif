package websocket

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID string
	conn   *websocket.Conn
	send   chan Message
}

func (c *Client) ReadPump() {
	defer func() {
		GlobalHub.unregister <- c
		c.conn.Close()
	}()

	for {
		var msg Message
		if err := c.conn.ReadJSON(&msg); err != nil {
			log.Printf("WebSocket read error from %s: %v", c.UserID, err)
			break
		}

		switch msg.Channel {
		case "chat":
			handleChatMessage(c, msg)

		case "notifications":
			log.Printf("Received client-sent notification (ignored): %+v", msg)

		default:
			log.Printf("Unknown WebSocket channel from %s: %s", c.UserID, msg.Channel)
		}
	}
}

func (c *Client) WritePump() {
	defer c.conn.Close()

	for msg := range c.send {
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Printf("WebSocket write error (user %s): %v", c.UserID, err)
			break
		}
	}
}
