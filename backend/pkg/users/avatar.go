package users

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	MaxAvatarSize     = 2 << 20 // 2MB
	AvatarUploadPath  = "uploads/avatars"
	StaticAvatarRoute = "/static/avatars/"
	DefaultAvatar     = StaticAvatarRoute + "default.jpg"
)

func SaveUploadedAvatar(r *http.Request, userID string) (string, error) {
	err := r.ParseMultipartForm(MaxAvatarSize)
	if err != nil {
		return DefaultAvatar, nil
	}

	file, header, err := r.FormFile("avatar")
	if err != nil || header == nil {
		return DefaultAvatar, nil
	}
	defer file.Close()

	// Validate MIME type by sniffing first 512 bytes
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return "", fmt.Errorf("could not read file header")
	}
	contentType := http.DetectContentType(buffer)

	if !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid content type: %s", contentType)
	}

	// Reset file pointer to beginning before saving
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("failed to reset file reader")
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		return "", fmt.Errorf("invalid file extension")
	}

	filename := fmt.Sprintf("%s%s", userID, ext)
	savePath := filepath.Join(AvatarUploadPath, filename)

	out, err := os.Create(savePath)
	if err != nil {
		return "", fmt.Errorf("could not save file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", fmt.Errorf("failed to write avatar: %w", err)
	}

	return StaticAvatarRoute + filename, nil
}
