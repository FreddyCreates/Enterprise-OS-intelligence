package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCompositionStatusRoute(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Fatalf("NewServer() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/composition/status", nil)
	rec := httptest.NewRecorder()

	srv.routes().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status code = %d, want %d", rec.Code, http.StatusOK)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if body["state"] != "composed" {
		t.Fatalf("state = %v, want composed", body["state"])
	}
}

func TestCompositionRegisterRoute(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Fatalf("NewServer() error = %v", err)
	}

	payload := map[string]interface{}{
		"component_id": "alpha-node-1",
		"role":         "router",
		"metadata": map[string]interface{}{
			"region": "dfw",
		},
	}
	raw, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/composition/register", bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	srv.routes().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status code = %d, want %d", rec.Code, http.StatusOK)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if body["ok"] != true {
		t.Fatalf("ok = %v, want true", body["ok"])
	}
	if body["composition_key"] != "router:alpha-node-1" {
		t.Fatalf("composition_key = %v, want router:alpha-node-1", body["composition_key"])
	}
}
