package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
)

// Context keys
const (
	nonceContextKey contextKey = "nonce"
)

// SecurityHeadersMiddleware adds security headers to the response
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Generate a nonce for this request
		nonce := generateNonce()
		w.Header().Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; script-src 'self' 'nonce-"+nonce+"'; style-src 'self' 'unsafe-inline'")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		// Pass the nonce to the request context if needed
		ctx := context.WithValue(r.Context(), nonceContextKey, nonce)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// generateNonce creates a random nonce for CSP
func generateNonce() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(b)
}

// CORSMiddleware handles CORS preflight requests and sets CORS headers
// to allow cross-origin requests from the specified origin.
// It also allows credentials and specific HTTP methods and headers.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://localhost:8080/")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

const (
	csrfTokenLength = 32
	csrfCookieName  = "csrf_token"
	csrfHeaderName  = "X-CSRF-Token"
)

// GenerateCSRFToken creates a new random token
func generateCSRFToken() string {
	b := make([]byte, csrfTokenLength)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

// CSRFMiddleware adds CSRF protection
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip validation for GET, HEAD, OPTIONS requests
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// Verify the token
		requestToken := r.Header.Get(csrfHeaderName)
		cookieToken, err := r.Cookie(csrfCookieName)

		// If there's no token in the request or cookie, or if they don't match
		if err != nil || requestToken == "" || cookieToken.Value != requestToken {
			http.Error(w, "CSRF token validation failed", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// SetCSRFToken middleware generates and sets a CSRF token without ending the request
func SetCSRFToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Create a new token
		token := generateCSRFToken()

		// Set it in a cookie
		http.SetCookie(w, &http.Cookie{
			Name:     csrfCookieName,
			Value:    token,
			Path:     "/",
			HttpOnly: false, // Allow JavaScript to read the cookie
			SameSite: http.SameSiteStrictMode,
			Secure:   true, // Set to false for local development without HTTPS
			MaxAge:   3600, // 1 hour
		})

		// Store token in context so other handlers can access it if needed
		ctx := context.WithValue(r.Context(), contextKey("csrfToken"), token)

		// Continue with the next handler (don't write response here)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetCSRFToken is a handler to refresh CSRF tokens
func GetCSRFToken(w http.ResponseWriter, r *http.Request) {
	token := generateCSRFToken()

	http.SetCookie(w, &http.Cookie{
		Name:  csrfCookieName,
		Value: token,
		Path:  "/",
		// HttpOnly: true,
		HttpOnly: false, // Allow JavaScript to read the cookie
		SameSite: http.SameSiteStrictMode,
		Secure:   true, // Set to false for local development without HTTPS
		MaxAge:   3600, // 1 hour
	})

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"csrf_token":"` + token + `"}`))
}
