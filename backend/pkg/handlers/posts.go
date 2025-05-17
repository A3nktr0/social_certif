package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"socialbackend/pkg/authz"
	"socialbackend/pkg/db"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/microcosm-cc/bluemonday"
)

type CreatePostRequest struct {
	Content     string   `json:"content"`
	ImageURL    string   `json:"image_url"`    // Optional
	Visibility  string   `json:"visibility"`   // "public", "private", "followers"
	TargetUsers []string `json:"target_users"` // For custom audience (optional)
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	rawContent := strings.TrimSpace(r.FormValue("content"))
	visibility := r.FormValue("visibility")

	if rawContent == "" && r.MultipartForm.File["image"] == nil {
		http.Error(w, "Post must have content or an image", http.StatusBadRequest)
		return
	}

	if visibility != "public" && visibility != "private" && visibility != "selected" {
		http.Error(w, "Invalid visibility", http.StatusBadRequest)
		return
	}

	// Sanitize content using bluemonday strict policy (no HTML allowed)
	policy := bluemonday.StrictPolicy()
	content := policy.Sanitize(rawContent)

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
			http.Error(w, "Invalid content type", http.StatusBadRequest)
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

		if err := os.MkdirAll("uploads/posts", os.ModePerm); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		filename := "post_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/posts", filename)

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

		imageURL = "/static/posts/" + filename
	}

	postID := uuid.New().String()
	now := time.Now()

	_, err = db.DB.Exec(`
		INSERT INTO posts (id, user_id, content, image, visibility, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, postID, userID, content, imageURL, visibility, now)
	if err != nil {
		fmt.Println("Error saving post:", err)
		http.Error(w, "Failed to save post", http.StatusInternalServerError)
		return
	}

	if visibility == "selected" {
		targetUsers := r.Form["target_users[]"]
		if len(targetUsers) > 0 {
			_, err := db.DB.Exec(`
				UPDATE posts SET allowed_ids = $1 WHERE id = $2
			`, pq.Array(targetUsers), postID)
			if err != nil {
				http.Error(w, "Failed to save target users", http.StatusInternalServerError)
				return
			}
		}
	}

	w.WriteHeader(http.StatusCreated)
}

func GetFeed(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	rows, err := db.DB.Query(`
	SELECT p.id, p.user_id, p.content, p.image, p.visibility, p.created_at,
	       u.id, u.first_name, u.last_name, u.nickname, u.avatar,
	       (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
	       EXISTS (
	           SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1
	       ) AS liked_by_user
	FROM posts p
	JOIN users u ON u.id = p.user_id
	WHERE
		(p.group_id IS NULL AND (
			p.visibility = 'public'
			OR p.user_id = $1
			OR (
				p.visibility = 'private'
				AND EXISTS (
					SELECT 1 FROM follows f
					WHERE f.follower_id = $1 AND f.followee_id = p.user_id AND f.status = 'accepted'
				)
			)
			OR (
				p.visibility = 'selected'
				AND $1 = ANY(p.allowed_ids)
			)
		))
		OR (
			p.group_id IN (
				SELECT group_id FROM group_members WHERE user_id = $1
			)
		)
	ORDER BY p.created_at DESC
	LIMIT 50
`, userID)

	if err != nil {
		fmt.Println("Error loading feed:", err)
		http.Error(w, "Failed to load feed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Author struct {
		ID     string `json:"id"`
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}

	type FeedPost struct {
		ID          string    `json:"id"`
		UserID      string    `json:"user_id"`
		Content     string    `json:"content"`
		Image       string    `json:"image"`
		Visibility  string    `json:"visibility"`
		CreatedAt   time.Time `json:"created_at"`
		LikeCount   int       `json:"like_count"`
		LikedByUser bool      `json:"liked_by_user"`
		Author      Author    `json:"author"`
	}

	var posts []FeedPost

	for rows.Next() {
		var p FeedPost
		var firstName, lastName, nickname, authorID string
		var avatar, image sql.NullString

		err := rows.Scan(
			&p.ID, &p.UserID, &p.Content, &image, &p.Visibility, &p.CreatedAt,
			&authorID, &firstName, &lastName, &nickname, &avatar,
			&p.LikeCount, &p.LikedByUser,
		)

		if err != nil {
			http.Error(w, "Error reading feed", http.StatusInternalServerError)
			return
		}

		if image.Valid {
			p.Image = image.String
		} else {
			p.Image = ""
		}

		name := nickname
		if name == "" {
			name = strings.TrimSpace(firstName + " " + lastName)
		}

		p.Author = Author{
			ID:     authorID,
			Name:   name,
			Avatar: "/static/avatars/default.jpg",
		}
		if avatar.Valid && avatar.String != "" {
			p.Author.Avatar = avatar.String
		}

		posts = append(posts, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func LikePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	// Check if user is allowed to like the post
	var groupID *string
	err := db.DB.QueryRow(`SELECT group_id FROM posts WHERE id = $1`, postID).Scan(&groupID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if groupID != nil {
		// Only allow like if user is member of the group
		var isMember bool
		err := db.DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
			)
		`, *groupID, userID).Scan(&isMember)
		if err != nil || !isMember {
			http.Error(w, "You are not allowed to like this post", http.StatusForbidden)
			return
		}
	}

	_, err = db.DB.Exec(`
		INSERT INTO post_likes (post_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, postID, userID)

	if err != nil {
		http.Error(w, "Failed to like post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func UnlikePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	// Check if user is allowed to unlike the post
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
			http.Error(w, "You are not allowed to unlike this post", http.StatusForbidden)
			return
		}
	}

	_, err = db.DB.Exec(`
		DELETE FROM post_likes
		WHERE post_id = $1 AND user_id = $2
	`, postID, userID)

	if err != nil {
		http.Error(w, "Failed to unlike post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func GetLikes(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	var count int
	err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM post_likes WHERE post_id = $1
	`, postID).Scan(&count)

	if err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

func HasLiked(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	var exists bool
	err := db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2
		)
	`, postID, userID).Scan(&exists)

	if err != nil {
		http.Error(w, "Failed to check like", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"liked": exists})
}

func GetPostByID(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	allowed, err := authz.CanUserAccessPost(userID, postID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if !allowed {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	row := db.DB.QueryRow(`
		SELECT p.id, p.user_id, p.content, p.image, p.visibility, p.created_at,
		       u.first_name, u.last_name, u.nickname, u.avatar
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE p.id = $1
	`, postID)

	var post struct {
		ID         string    `json:"id"`
		UserID     string    `json:"user_id"`
		Content    string    `json:"content"`
		Image      string    `json:"image"`
		Visibility string    `json:"visibility"`
		CreatedAt  time.Time `json:"created_at"`
		Author     struct {
			ID     string `json:"id"`
			Name   string `json:"name"`
			Avatar string `json:"avatar"`
		} `json:"author"`
	}

	var firstName, lastName, nickname, avatar, image sql.NullString

	err = row.Scan(
		&post.ID, &post.UserID, &post.Content, &image, &post.Visibility, &post.CreatedAt,
		&firstName, &lastName, &nickname, &avatar,
	)
	if err != nil {
		fmt.Println("Error loading post:", err)
		http.Error(w, "Failed to load post", http.StatusInternalServerError)
		return
	}

	if image.Valid {
		post.Image = image.String
	} else {
		post.Image = ""
	}

	post.Author.ID = post.UserID
	if nickname.Valid && nickname.String != "" {
		post.Author.Name = nickname.String
	} else {
		post.Author.Name = strings.TrimSpace(firstName.String + " " + lastName.String)
	}
	post.Author.Avatar = "/static/avatars/default.jpg"
	if avatar.Valid && avatar.String != "" {
		post.Author.Avatar = avatar.String
	}

	var likeCount int
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM post_likes WHERE post_id = $1`, postID).Scan(&likeCount)

	var likedByUser bool
	_ = db.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2
		)
	`, postID, userID).Scan(&likedByUser)

	response := map[string]interface{}{
		"id":            post.ID,
		"user_id":       post.UserID,
		"content":       post.Content,
		"image":         post.Image,
		"visibility":    post.Visibility,
		"created_at":    post.CreatedAt,
		"like_count":    likeCount,
		"liked_by_user": likedByUser,
		"author": map[string]interface{}{
			"id":     post.Author.ID,
			"name":   post.Author.Name,
			"avatar": post.Author.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetPostsByUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	targetUserID := chi.URLParam(r, "id")

	// Self profile = full access
	isOwnProfile := userID == targetUserID

	rows, err := db.DB.Query(`
		SELECT 
			p.id, p.user_id, p.content, p.image, p.visibility, p.created_at,
			u.id, u.first_name, u.last_name, u.nickname, u.avatar,
			(SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
			EXISTS (
				SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1
			) AS liked_by_user
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE p.user_id = $2
		AND (
			$3::boolean = TRUE -- owner
			OR p.visibility = 'public'
			OR (
				p.visibility = 'private'
				AND EXISTS (
					SELECT 1 FROM follows f
					WHERE f.follower_id = $1 AND f.followee_id = $2 AND f.status = 'accepted'
				)
			)
			OR (
				p.visibility = 'selected'
				AND $1 = ANY(p.allowed_ids)
			)
		)
		ORDER BY p.created_at DESC
		LIMIT 50
	`, userID, targetUserID, isOwnProfile)
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

	type FeedPost struct {
		ID          string    `json:"id"`
		UserID      string    `json:"user_id"`
		Content     string    `json:"content"`
		Image       string    `json:"image"`
		Visibility  string    `json:"visibility"`
		CreatedAt   time.Time `json:"created_at"`
		LikeCount   int       `json:"like_count"`
		LikedByUser bool      `json:"liked_by_user"`
		Author      Author    `json:"author"`
	}

	var posts []FeedPost

	for rows.Next() {
		var p FeedPost
		var firstName, lastName, nickname, authorID string
		var avatar, image sql.NullString

		err := rows.Scan(
			&p.ID, &p.UserID, &p.Content, &image, &p.Visibility, &p.CreatedAt,
			&authorID, &firstName, &lastName, &nickname, &avatar,
			&p.LikeCount, &p.LikedByUser,
		)
		if err != nil {
			http.Error(w, "Error reading post", http.StatusInternalServerError)
			return
		}

		if image.Valid {
			p.Image = image.String
		} else {
			p.Image = ""
		}

		name := nickname
		if name == "" {
			name = strings.TrimSpace(firstName + " " + lastName)
		}

		p.Author = Author{
			ID:     authorID,
			Name:   name,
			Avatar: "/static/avatars/default.jpg",
		}
		if avatar.Valid && avatar.String != "" {
			p.Author.Avatar = avatar.String
		}

		posts = append(posts, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// ----------- Edit Post -----------

type EditPostRequest struct {
	Content  string `json:"content"`
	ImageURL string `json:"imageUrl"` // Optional: "" means delete, existing value means keep, new means replace
}

func EditPost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	rawContent := strings.TrimSpace(r.FormValue("content"))
	if rawContent == "" && r.MultipartForm.File["image"] == nil && r.FormValue("image_url") == "" {
		http.Error(w, "Content or image required", http.StatusBadRequest)
		return
	}

	policy := bluemonday.StrictPolicy()
	content := policy.Sanitize(rawContent)

	// Step 1: Get existing image path for deletion check
	var existingImage sql.NullString
	err := db.DB.QueryRow(`SELECT image FROM posts WHERE id = $1 AND user_id = $2`, postID, userID).Scan(&existingImage)
	if err == sql.ErrNoRows {
		http.Error(w, "Post not found or unauthorized", http.StatusForbidden)
		return
	} else if err != nil {
		http.Error(w, "Failed to retrieve existing image", http.StatusInternalServerError)
		return
	}

	// Optional image deletion or replacement
	imageURL := r.FormValue("image_url") // "" = remove, value = keep (or will be overridden below)

	// Step 2: Handle new image upload
	file, handler, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()

		buffer := make([]byte, 512)
		if _, err := file.Read(buffer); err != nil {
			http.Error(w, "Could not read file header", http.StatusBadRequest)
			return
		}
		if !strings.HasPrefix(http.DetectContentType(buffer), "image/") {
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

		if err := os.MkdirAll("uploads/posts", os.ModePerm); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		filename := "post_" + uuid.New().String() + ext
		savePath := filepath.Join("uploads/posts", filename)

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

		imageURL = "/static/posts/" + filename
	}

	// Step 3: Determine if the old image should be deleted
	imageChanged := (imageURL == "" && existingImage.Valid) || (imageURL != "" && imageURL != existingImage.String)
	if imageChanged && existingImage.Valid && existingImage.String != "/static/posts/default.jpg" {
		_ = utils.DeleteImageFromTable(
			db.DB,
			"posts",
			"id",
			postID,
			userID,
			"image",
			"/static/posts/",
			"/uploads/posts/",
			"default.jpg",
		)
	}

	// Step 4: Prepare value for DB update
	var imageColumn interface{}
	if imageURL == "" {
		imageColumn = nil
	} else {
		imageColumn = imageURL
	}

	// Step 5: Update the post
	res, err := db.DB.Exec(`
		UPDATE posts 
		SET content = $1, image = $2
		WHERE id = $3 AND user_id = $4
	`, content, imageColumn, postID, userID)

	if err != nil {
		http.Error(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "Not authorized or post not found", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ----------- Delete Post -----------

func DeletePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	postID := chi.URLParam(r, "id")

	// Delete the image using the helper
	err := utils.DeleteImageFromTable(
		db.DB,
		"posts",           // table name
		"id",              // id field
		postID,            // post ID
		userID,            // user ID for ownership
		"image",           // image column name
		"/static/posts/",  // public URL prefix
		"/uploads/posts/", // actual upload path
		"default.jpg",     // default image filename
	)
	if err != nil {
		http.Error(w, "Failed to delete post image", http.StatusInternalServerError)
		return
	}

	// Delete the post itself
	_, err = db.DB.Exec(`
		DELETE FROM posts WHERE id = $1 AND user_id = $2
	`, postID, userID)
	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
