package middleware

import (
	"context"
	"net/http"

	"socialbackend/pkg/auth"
)

type contextKey string

const UserIDKey = contextKey("userID")

// RequireAuth is a middleware that checks if the user is authenticated
// by verifying the JWT token in the request. If authenticated, it adds
// the user ID to the request context.
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
// set by the RequireAuth middleware.
func GetUserID(r *http.Request) string {
	id, _ := r.Context().Value(UserIDKey).(string)
	return id
}

// WithUserID adds a user ID to the request context
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}
