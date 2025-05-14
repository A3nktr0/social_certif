package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"

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
			commentID, content, image, createdAt string
			userID, nickname, avatar             string
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
			"image":      image,
			"created_at": createdAt,
			"user": map[string]string{
				"id":       userID,
				"nickname": nickname,
				"avatar":   avatar,
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

	var body EditCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	safeContent := bluemonday.StrictPolicy().Sanitize(strings.TrimSpace(body.Content))
	if safeContent == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	res, err := db.DB.Exec(`
		UPDATE comments SET content = $1
		WHERE id = $2 AND user_id = $3
	`, safeContent, commentID, userID)
	if err != nil {
		http.Error(w, "Failed to update comment", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "Not authorized or comment not found", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ----------- Delete Comment -----------

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	commentID := chi.URLParam(r, "id")

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
