package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHandleJuliaProtocolPulse_BadJSON(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Fatalf("new server: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/julia/protocol-pulse", strings.NewReader("{bad"))
	w := httptest.NewRecorder()
	srv.handleJuliaProtocolPulse(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}

	var resp CouplingResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Status != "error" {
		t.Fatalf("expected status error, got %q", resp.Status)
	}
}

func TestHandleJuliaVirtualStatus_Timeout(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(50 * time.Millisecond)
		_, _ = w.Write([]byte(`{"id":"x","status":"ok","result":{},"timestamp":1}`))
	}))
	defer upstream.Close()

	srv, err := NewServer()
	if err != nil {
		t.Fatalf("new server: %v", err)
	}
	srv.juliaURL = upstream.URL
	srv.juliaClient = &http.Client{Timeout: 1 * time.Millisecond}

	req := httptest.NewRequest(http.MethodGet, "/julia/virtual-status", nil)
	w := httptest.NewRecorder()
	srv.handleJuliaVirtualStatus(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", w.Code)
	}
}

func TestHandleJuliaVirtualStatus_UpdatesProtocolMetrics(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(CouplingResponse{
			ID:     "ok-1",
			Status: "ok",
			Result: map[string]interface{}{
				"coherence":      0.91,
				"health":         0.88,
				"phiAccumulated": 4.2,
				"clean_score":    0.95,
				"protocol":       "RSHIP-CLEAN-VIRTUAL-PROTOCOL",
			},
			Timestamp: time.Now().UnixMilli(),
		})
	}))
	defer upstream.Close()

	srv, err := NewServer()
	if err != nil {
		t.Fatalf("new server: %v", err)
	}
	srv.juliaURL = upstream.URL

	req := httptest.NewRequest(http.MethodGet, "/julia/virtual-status", nil)
	w := httptest.NewRecorder()
	srv.handleJuliaVirtualStatus(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	metrics := srv.router.Metrics()
	if metrics["protocol_clean_score"] != 0.95 {
		t.Fatalf("expected protocol_clean_score=0.95, got %v", metrics["protocol_clean_score"])
	}
}
