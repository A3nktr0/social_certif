package utils

import "database/sql"

func GetMutualFollowers(db *sql.DB, userID string) []string {

	rows, err := db.Query(`
		SELECT f1.followee_id
		FROM follows f1
		JOIN follows f2 ON f1.followee_id = f2.follower_id
		WHERE f1.follower_id = $1 AND f1.status = 'accepted'
		  AND f2.followee_id = $1 AND f2.status = 'accepted'
	`, userID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}
