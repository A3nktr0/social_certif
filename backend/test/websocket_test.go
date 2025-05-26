package test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"socialbackend/pkg/middleware"
	ws "socialbackend/pkg/websocket"

	"github.com/gorilla/websocket"
)

func TestWebSocketConnection(t *testing.T) {
	// Create test server with the WebSocket handler
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock authentication middleware
		r = r.WithContext(middleware.WithUserID(r.Context(), "testuser"))
		ws.ServeWS(w, r)
	}))
	defer server.Close()

	// Convert http URL to ws URL
	wsURL := strings.Replace(server.URL, "http", "ws", 1) + "/api/ws"

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Could not connect to WebSocket: %v", err)
	}
	defer conn.Close()

	// Send a test message
	testMsg := ws.Message{
		Channel: "chat",
		Event:   "message",
		Content: "Hello, world!",
		To:      "user2",
	}

	if err := conn.WriteJSON(testMsg); err != nil {
		t.Fatalf("Could not send message: %v", err)
	}

	// Wait for a response or check connection status
	// This part would depend on your implementation
}
