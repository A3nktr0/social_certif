package helpers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"socialbackend/pkg/constants"
	"socialbackend/pkg/db"
	"socialbackend/pkg/websocket"
)

func Create(userID, fromUserID, notifType, content string, data map[string]interface{}) {
	var fromUUID sql.NullString
	var isSystem bool
	var fromPtr *string
	var senderMeta map[string]interface{}

	if fromUserID == "" || fromUserID == "system" {
		fromUUID = sql.NullString{Valid: false}
		isSystem = true
	} else {
		fromUUID = sql.NullString{String: fromUserID, Valid: true}
		fromPtr = &fromUserID
		isSystem = false

		var nickname sql.NullString
		err := db.DB.QueryRow(`
			SELECT nickname FROM users WHERE id = $1
		`, fromUserID).Scan(&nickname)
		if err == nil && nickname.Valid {
			senderMeta = map[string]interface{}{
				"nickname": nickname.String,
			}
		}
	}

	// Merge meta with passed data
	if data == nil {
		data = map[string]interface{}{}
	}
	for k, v := range senderMeta {
		data[k] = v
	}

	// Marshal to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Failed to marshal notification data: %v", err)
		jsonData = []byte(`{}`)
	}

	// Save to DB
	_, err = db.DB.Exec(`
		INSERT INTO notifications (user_id, from_user_id, type, content, data)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, fromUUID, notifType, content, jsonData)

	if err != nil {
		log.Printf("DB insert failed: %v", err)
		return
	}

	fmt.Println("Notification created:", websocket.Message{
		Channel:  constants.ChannelNotifications,
		Event:    notifType,
		From:     fromPtr,
		To:       userID,
		Content:  content,
		Data:     data,
		IsSystem: isSystem,
	})

	// Send WebSocket
	websocket.Send(websocket.Message{
		Channel:  constants.ChannelNotifications,
		Event:    notifType,
		From:     fromPtr,
		To:       userID,
		Content:  content,
		Data:     data,
		IsSystem: isSystem,
	})
}
