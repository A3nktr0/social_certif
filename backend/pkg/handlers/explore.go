package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
)

type SuggestedUser struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Avatar    string `json:"avatar"`
	Nickname  string `json:"nickname"`
}

func ExploreUsers(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname
		FROM users u
		WHERE u.id != $1
		  AND NOT EXISTS (
		    SELECT 1 FROM follows f
		    WHERE f.follower_id = $1 AND f.followee_id = u.id
		  )
		LIMIT 20
	`, currentUserID)
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var suggestions []SuggestedUser
	for rows.Next() {
		var u SuggestedUser
		var avatar sql.NullString
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &avatar, &u.Nickname); err != nil {
			http.Error(w, "Failed to parse user", http.StatusInternalServerError)
			return
		}
		u.Avatar = avatar.String
		if !avatar.Valid || u.Avatar == "" {
			u.Avatar = "/static/avatars/default.jpg"
		}
		suggestions = append(suggestions, u)
	}

	if len(suggestions) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]SuggestedUser{})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suggestions)
}
