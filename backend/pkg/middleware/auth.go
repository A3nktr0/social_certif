package middleware

import (
	"context"
	"net/http"

	"socialbackend/pkg/auth"
)

type contextKey string

const UserIDKey = contextKey("userID")

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, err := auth.ParseJWTFromRequest(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID retrieves the authenticated user's ID from context
func GetUserID(r *http.Request) string {
	id, _ := r.Context().Value(UserIDKey).(string)
	return id
}
