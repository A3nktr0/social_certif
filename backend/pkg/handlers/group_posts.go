package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/microcosm-cc/bluemonday"

	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
)

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	groupID := chi.URLParam(r, "id")

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		fmt.Println("Error parsing form:", err)
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	rawContent := strings.TrimSpace(r.FormValue("content"))

	if rawContent == "" && r.MultipartForm.File["image"] == nil {
		http.Error(w, "Post must have content or an image", http.StatusBadRequest)
		return
	}

	// Sanitize content
	policy := bluemonday.StrictPolicy()
	content := policy.Sanitize(rawContent)

	// Check group membership
	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		fmt.Println("Error checking group membership:", err)
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	// Handle optional image upload
	var imageURL string
	file, handler, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()

		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil {
			fmt.Println("Error reading file:", err)
			http.Error(w, "Could not read file", http.StatusBadRequest)
			return
		}
		contentType := http.DetectContentType(buffer)
		if !strings.HasPrefix(contentType, "image/") {
			fmt.Println("Invalid image type:", contentType)
			http.Error(w, "Invalid image type", http.StatusBadRequest)
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			fmt.Println("Error resetting file reader:", err)
			http.Error(w, "Failed to reset file reader", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			fmt.Println("Invalid file extension:", ext)
			http.Error(w, "Invalid file extension", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll("uploads/group_posts", os.ModePerm); err != nil {
			fmt.Println("Error creating upload folder:", err)
			http.Error(w, "Failed to create upload folder", http.StatusInternalServerError)
			return
		}

		filename := "group_post_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/group_posts", filename)

		out, err := os.Create(savePath)
		if err != nil {
			fmt.Println("Error creating file:", err)
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			fmt.Println("Error saving file:", err)
			http.Error(w, "Failed to write image", http.StatusInternalServerError)
			return
		}

		imageURL = "/static/group_posts/" + filename
	}

	postID := uuid.New().String()
	now := time.Now()

	_, err = db.DB.Exec(`
		INSERT INTO posts (id, user_id, group_id, content, image, visibility, created_at)
		VALUES ($1, $2, $3, $4, $5, 'group', $6)
	`, postID, userID, groupID, content, imageURL, now)
	if err != nil {
		fmt.Println("Error inserting post:", err)
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"post_id": postID,
	})
}
func GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Check group membership
	var isMember bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	rows, err := db.DB.Query(`
		SELECT
			p.id, p.user_id, p.content, p.image, p.created_at,
			u.nickname, u.avatar,
			(SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
			EXISTS (
				SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $2
			) AS liked_by_user
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE p.group_id = $1
		ORDER BY p.created_at DESC
	`, groupID, userID)
	if err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Author struct {
		ID     string `json:"id"`
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}

	type Post struct {
		ID          string    `json:"id"`
		UserID      string    `json:"user_id"`
		Content     string    `json:"content"`
		Image       string    `json:"image,omitempty"`
		CreatedAt   time.Time `json:"created_at"`
		Visibility  string    `json:"visibility"`
		LikeCount   int       `json:"like_count"`
		LikedByUser bool      `json:"liked_by_user"`
		Author      Author    `json:"author"`
	}

	var posts []Post
	for rows.Next() {
		var p Post
		var nickname string
		err := rows.Scan(
			&p.ID, &p.UserID, &p.Content, &p.Image, &p.CreatedAt,
			&nickname, &p.Author.Avatar,
			&p.LikeCount, &p.LikedByUser,
		)
		if err != nil {
			http.Error(w, "Failed to scan post", http.StatusInternalServerError)
			return
		}

		p.Visibility = "group"
		p.Author.ID = p.UserID
		p.Author.Name = nickname

		posts = append(posts, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}
