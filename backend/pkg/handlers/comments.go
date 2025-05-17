package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/microcosm-cc/bluemonday"
)

type CreateCommentRequest struct {
	Content string `json:"content"`
}

func CreateComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	// Check if user is allowed to comment
	var groupID *string
	err := db.DB.QueryRow(`SELECT group_id FROM posts WHERE id = $1`, postID).Scan(&groupID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if groupID != nil {
		var isMember bool
		err := db.DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
			)
		`, *groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			http.Error(w, "You are not allowed to comment on this post", http.StatusForbidden)
			return
		}
	}

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	content := strings.TrimSpace(r.FormValue("content"))
	policy := bluemonday.StrictPolicy()
	safeContent := policy.Sanitize(content)

	if safeContent == "" && r.MultipartForm.File["image"] == nil {
		http.Error(w, "Comment must have content or image", http.StatusBadRequest)
		return
	}

	// Handle image upload
	var imageURL string
	file, handler, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()

		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil {
			http.Error(w, "Could not read file header", http.StatusBadRequest)
			return
		}
		contentType := http.DetectContentType(buffer)
		if !strings.HasPrefix(contentType, "image/") {
			http.Error(w, "Invalid image type", http.StatusBadRequest)
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			http.Error(w, "Failed to reset file reader", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			http.Error(w, "Invalid file extension", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll("uploads/comments", os.ModePerm); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		filename := "comment_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/comments", filename)

		out, err := os.Create(savePath)
		if err != nil {
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to write image", http.StatusInternalServerError)
			return
		}

		imageURL = "/static/comments/" + filename
	}

	_, err = db.DB.Exec(`
		INSERT INTO comments (post_id, user_id, content, image)
		VALUES ($1, $2, $3, $4)
	`, postID, userID, safeContent, imageURL)

	if err != nil {
		http.Error(w, "Failed to comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
func GetComments(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")

	rows, err := db.DB.Query(`
		SELECT c.id, c.content, c.image, c.created_at,
		       u.id, u.nickname, u.avatar
		FROM comments c
		JOIN users u ON u.id = c.user_id
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC
	`, postID)

	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var (
			commentID, content, createdAt, userID string
			image, nickname, avatar               sql.NullString
		)

		err := rows.Scan(
			&commentID, &content, &image, &createdAt,
			&userID, &nickname, &avatar,
		)
		if err != nil {
			http.Error(w, "Failed to parse comment", http.StatusInternalServerError)
			return
		}

		comments = append(comments, map[string]interface{}{
			"id":         commentID,
			"content":    content,
			"image":      image.String, // empty string if null
			"created_at": createdAt,
			"user": map[string]string{
				"id":       userID,
				"nickname": nickname.String,
				"avatar": func() string {
					if avatar.Valid && avatar.String != "" {
						return avatar.String
					}
					return "/static/avatars/default.jpg"
				}(),
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

type EditCommentRequest struct {
	Content string `json:"content"`
}

func EditComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	commentID := chi.URLParam(r, "id")

	var existingImage sql.NullString
	var authorID string
	err := db.DB.QueryRow(`
		SELECT user_id, image FROM comments WHERE id = $1
	`, commentID).Scan(&authorID, &existingImage)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	if authorID != userID {
		http.Error(w, "Not authorized", http.StatusForbidden)
		return
	}

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	content := strings.TrimSpace(r.FormValue("content"))
	policy := bluemonday.StrictPolicy()
	safeContent := policy.Sanitize(content)

	if safeContent == "" && r.MultipartForm.File["image"] == nil && r.FormValue("image_url") == "" {
		http.Error(w, "Comment must have content or image", http.StatusBadRequest)
		return
	}

	imageURL := r.FormValue("image_url") // "" means remove

	file, handler, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()

		// validate image
		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil || !strings.HasPrefix(http.DetectContentType(buffer), "image/") {
			http.Error(w, "Invalid image type", http.StatusBadRequest)
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			http.Error(w, "Failed to reset image reader", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			http.Error(w, "Unsupported image format", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll("uploads/comments", os.ModePerm); err != nil {
			http.Error(w, "Failed to create directory", http.StatusInternalServerError)
			return
		}

		filename := "comment_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/comments", filename)

		out, err := os.Create(savePath)
		if err != nil {
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		defer out.Close()
		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to write image", http.StatusInternalServerError)
			return
		}

		imageURL = "/static/comments/" + filename
	}

	shouldDeleteOld := (imageURL == "" && existingImage.Valid) || (imageURL != "" && imageURL != existingImage.String)
	if shouldDeleteOld && existingImage.Valid && existingImage.String != "/static/comments/default.jpg" {
		_ = utils.DeleteImageFromTable(
			db.DB,
			"comments",
			"id",
			commentID,
			userID,
			"image",
			"/static/comments/",
			"/uploads/comments/",
			"default.jpg",
		)
	}

	var imageCol interface{}
	if imageURL == "" {
		imageCol = nil // remove image
	} else {
		imageCol = imageURL // update to new one
	}

	res, err := db.DB.Exec(`
		UPDATE comments SET content = $1, image = $2
		WHERE id = $3 AND user_id = $4
	`, safeContent, imageCol, commentID, userID)
	if err != nil {
		http.Error(w, "Failed to update comment", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "Update failed", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ----------- Delete Comment -----------

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	commentID := chi.URLParam(r, "id")

	// check if user is allowed to delete
	var authorID string
	err := db.DB.QueryRow(`
		SELECT user_id FROM comments WHERE id = $1
	`, commentID).Scan(&authorID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	if authorID != userID {
		http.Error(w, "Not authorized", http.StatusForbidden)
		return
	}

	err = utils.DeleteImageFromTable(
		db.DB,
		"comments",
		"id",
		commentID,
		userID,
		"image",
		"/static/comments/",
		"/uploads/comments/",
		"default.jpg",
	)
	if err != nil {
		http.Error(w, "Failed to delete comment image", http.StatusInternalServerError)
		return
	}

	res, err := db.DB.Exec(`
		DELETE FROM comments WHERE id = $1 AND user_id = $2
	`, commentID, userID)
	if err != nil {
		http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "Not authorized or comment not found", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
}
