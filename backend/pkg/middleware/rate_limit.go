package middleware

import (
	"net/http"
	"sync"
	"time"
)

var clients = make(map[string]time.Time)
var mu sync.Mutex

func RateLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.Header.Get("X-Forwarded-For")
		if ip == "" {
			ip = r.RemoteAddr
		}

		mu.Lock()
		defer mu.Unlock()

		if t, exists := clients[ip]; exists && time.Since(t) < 2*time.Second {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		clients[ip] = time.Now()
		next.ServeHTTP(w, r)
	}
}
