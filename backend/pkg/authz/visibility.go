package authz

import (
	"socialbackend/pkg/db"
	"strings"

	"github.com/lib/pq"
)

func CanUserAccessPost(userID string, postID string) (bool, error) {
	var visibility string
	var authorID string
	var allowedIDs []string

	err := db.DB.QueryRow(`
		SELECT visibility, user_id, allowed_ids
		FROM posts
		WHERE id = $1
	`, postID).Scan(&visibility, &authorID, pq.Array(&allowedIDs))
	if err != nil {
		return false, err
	}

	if userID == authorID {
		return true, nil
	}

	switch visibility {
	case "public":
		return true, nil
	case "private":
		var isFollower bool
		err := db.DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM follows
				WHERE follower_id = $1 AND followee_id = $2 AND status = 'accepted'
			)
		`, userID, authorID).Scan(&isFollower)
		if err != nil {
			return false, err
		}
		return isFollower, nil
	case "selected":
		for _, id := range allowedIDs {
			if strings.EqualFold(id, userID) {
				return true, nil
			}
		}
		return false, nil
	default:
		return false, nil
	}
}
