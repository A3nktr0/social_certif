package websocket

const maxContentLength = 1000 // tighter limit for UX and spam control

func handleChatMessage(c *Client, msg Message) {
	msg.From = &c.UserID
	GlobalHub.broadcast <- msg
}
