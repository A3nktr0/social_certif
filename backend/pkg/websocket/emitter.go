package websocket

import (
	"log"
)

// Send sends a message to a user with optional metadata
func Send(opts Message) {
	msg := Message{
		Channel:  opts.Channel,
		Event:    opts.Event,
		From:     opts.From,
		To:       opts.To,
		Content:  opts.Content,
		Data:     opts.Data,
		IsSystem: opts.IsSystem,
	}

	GlobalHub.SendToUser(opts.To, msg)

	log.Printf("WebSocket sent to %s | event=%s channel=%s", msg.To, msg.Event, msg.Channel)
}
