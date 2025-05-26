package test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"socialbackend/pkg/middleware"
)

func TestRateLimitMiddleware(t *testing.T) {
	handler := middleware.RateLimit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// First request should pass
	req1, _ := http.NewRequest("GET", "/", nil)
	req1.RemoteAddr = "192.168.1.1:3000"
	rr1 := httptest.NewRecorder()
	handler.ServeHTTP(rr1, req1)

	if rr1.Code != http.StatusOK {
		t.Errorf("First request should pass, got: %d", rr1.Code)
	}

	// Second immediate request should be rate limited
	req2, _ := http.NewRequest("GET", "/", nil)
	req2.RemoteAddr = "192.168.1.1:3000"
	rr2 := httptest.NewRecorder()
	handler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusTooManyRequests {
		t.Errorf("Second request should be rate limited, got: %d", rr2.Code)
	}

	// Wait and try again - should pass
	time.Sleep(2100 * time.Millisecond)
	req3, _ := http.NewRequest("GET", "/", nil)
	req3.RemoteAddr = "192.168.1.1:3000"
	rr3 := httptest.NewRecorder()
	handler.ServeHTTP(rr3, req3)

	if rr3.Code != http.StatusOK {
		t.Errorf("Request after waiting should pass, got: %d", rr3.Code)
	}
}
