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
	var groupID *string

	err := db.DB.QueryRow(`
		SELECT visibility, user_id, allowed_ids, group_id
		FROM posts
		WHERE id = $1
	`, postID).Scan(&visibility, &authorID, pq.Array(&allowedIDs), &groupID)
	if err != nil {
		return false, err
	}

	if userID == authorID {
		return true, nil
	}

	switch visibility {
	case "public":
		return true, nil
	case "group":
		if groupID == nil {
			return false, nil
		}

		var isMember bool
		err := db.DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
			)
		`, *groupID, userID).Scan(&isMember)
		if err != nil {
			return false, err
		}
		return isMember, nil

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
