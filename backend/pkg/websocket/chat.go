package websocket

import "log"

func handleChatMessage(c *Client, msg Message) {
	// TODO: dispatch to chat hub or DB
	log.Printf("Chat message from %s: %s", c.UserID, msg.Content)
}
