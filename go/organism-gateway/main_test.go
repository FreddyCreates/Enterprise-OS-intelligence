package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func mustJSON(t *testing.T, v interface{}) *bytes.Reader {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	return bytes.NewReader(raw)
}

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

	req := httptest.NewRequest(http.MethodPost, "/composition/register", mustJSON(t, map[string]interface{}{
		"component_id": "alpha-node-1",
		"role":         "router",
		"metadata": map[string]interface{}{
			"region": "dfw",
		},
	}))
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

func TestCompositionLinkAndDiffuseRoutes(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Fatalf("NewServer() error = %v", err)
	}

	register := func(id, role string) {
		req := httptest.NewRequest(http.MethodPost, "/composition/register", mustJSON(t, map[string]interface{}{
			"component_id": id,
			"role":         role,
		}))
		rec := httptest.NewRecorder()
		srv.routes().ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("register status = %d, want %d", rec.Code, http.StatusOK)
		}
	}
	register("alpha-node-1", "router")
	register("beta-node-2", "router")

	linkReq := httptest.NewRequest(http.MethodPost, "/composition/link", mustJSON(t, map[string]interface{}{
		"from_component_id": "alpha-node-1",
		"to_component_id":   "beta-node-2",
		"relation":          "depends_on",
		"weight":            0.75,
	}))
	linkRec := httptest.NewRecorder()
	srv.routes().ServeHTTP(linkRec, linkReq)
	if linkRec.Code != http.StatusOK {
		t.Fatalf("link status = %d, want %d", linkRec.Code, http.StatusOK)
	}

	diffuseReq := httptest.NewRequest(http.MethodPost, "/composition/diffuse", mustJSON(t, map[string]interface{}{
		"signal":      "policy-update",
		"scope":       "role",
		"target_role": "router",
		"intensity":   0.9,
	}))
	diffuseRec := httptest.NewRecorder()
	srv.routes().ServeHTTP(diffuseRec, diffuseReq)
	if diffuseRec.Code != http.StatusOK {
		t.Fatalf("diffuse status = %d, want %d", diffuseRec.Code, http.StatusOK)
	}

	statusReq := httptest.NewRequest(http.MethodGet, "/composition/status", nil)
	statusRec := httptest.NewRecorder()
	srv.routes().ServeHTTP(statusRec, statusReq)
	if statusRec.Code != http.StatusOK {
		t.Fatalf("status code = %d, want %d", statusRec.Code, http.StatusOK)
	}

	var statusBody map[string]interface{}
	if err := json.Unmarshal(statusRec.Body.Bytes(), &statusBody); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if statusBody["component_count"] != float64(2) {
		t.Fatalf("component_count = %v, want 2", statusBody["component_count"])
	}
	if statusBody["link_count"] != float64(1) {
		t.Fatalf("link_count = %v, want 1", statusBody["link_count"])
	}
	if statusBody["diffusion_count"] != float64(1) {
		t.Fatalf("diffusion_count = %v, want 1", statusBody["diffusion_count"])
	}
}

func TestCompositionLinkValidation(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Fatalf("NewServer() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/composition/link", mustJSON(t, map[string]interface{}{
		"from_component_id": "missing-a",
		"to_component_id":   "missing-b",
	}))
	rec := httptest.NewRecorder()
	srv.routes().ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status code = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}
