// main.go — Organism Gateway HTTP Server
//
// Exposes the organism intelligence substrate as an HTTP/JSON API.
// All endpoints are encrypted in transit (use TLS in production).
//
// Routes
// ──────
//   GET  /health              — liveness check
//   POST /syn/bind            — imprint a SYN binding
//   GET  /syn/query?label=X   — query a binding (local, instant)
//   POST /syn/revoke          — revoke a binding
//   POST /syn/revoke-all      — nuclear revoke all
//   GET  /syn/status          — list all binding metadata
//   POST /route               — phi-weighted model routing
//   POST /route/fallback      — cascade fallback routing
//   POST /route/outcome       — record routing outcome
//   GET  /metrics             — aggregate gateway metrics
//
// Ring: Interface Ring | Go Gateway

package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	orgcrypto "organism-gateway/internal/crypto"
	"organism-gateway/internal/routing"
	"organism-gateway/internal/syn"
)

// ── Server ────────────────────────────────────────────────────────────────────

type Server struct {
	router      *routing.ModelRouter
	synProxy    *syn.SynProxy
	aesKey      [32]byte
	startAt     time.Time
	juliaClient *http.Client
	juliaURL    string

	cbMu          sync.Mutex
	cbFailures    int
	cbOpenUntil   time.Time
	cbLastError   string
	couplingState CouplingState
}

type CouplingState struct {
	Connected      bool      `json:"connected"`
	Degraded       bool      `json:"degraded"`
	LastSuccessAt  time.Time `json:"last_success_at"`
	LastFailureAt  time.Time `json:"last_failure_at"`
	LastSyncAt     time.Time `json:"last_sync_at"`
	SyncLagMs      int64     `json:"sync_lag_ms"`
	FailureCount   int       `json:"failure_count"`
	CircuitOpen    bool      `json:"circuit_open"`
	CircuitOpenFor int64     `json:"circuit_open_for_ms"`
	LastError      string    `json:"last_error"`
	Coherence      float64   `json:"coherence"`
	Health         float64   `json:"health"`
	PhiAccumulated float64   `json:"phiAccumulated"`
	CleanScore     float64   `json:"clean_score"`
	Protocol       string    `json:"protocol"`
}

type CouplingEnvelope struct {
	ID        string                 `json:"id"`
	Command   string                 `json:"command"`
	Params    map[string]interface{} `json:"params"`
	Timestamp int64                  `json:"timestamp"`
}

type CouplingError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type CouplingResponse struct {
	ID        string         `json:"id"`
	Status    string         `json:"status"`
	Result    interface{}    `json:"result,omitempty"`
	Error     *CouplingError `json:"error,omitempty"`
	Timestamp int64          `json:"timestamp"`
}

func NewServer() (*Server, error) {
	// Derive the ring AES key from environment variables (or a default for dev)
	masterSecret := envOr("ORGANISM_MASTER_SECRET", "dev-master-secret-change-in-prod")
	salt := envOr("ORGANISM_KEY_SALT", "organism-gateway-salt-v1")
	aesKey, err := orgcrypto.DeriveKey([]byte(masterSecret), []byte(salt), []byte("organism-aes-key-v1"))
	if err != nil {
		return nil, fmt.Errorf("derive AES key: %w", err)
	}

	return &Server{
		router:      routing.NewModelRouter(),
		synProxy:    syn.NewSynProxy(aesKey),
		aesKey:      aesKey,
		startAt:     time.Now(),
		juliaClient: &http.Client{Timeout: 8 * time.Second},
		juliaURL:    envOr("ORGANISM_COUPLING_URL", "http://127.0.0.1:8874/command"),
	}, nil
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	state := s.snapshotCouplingState()
	writeJSON(w, 200, map[string]interface{}{
		"status":    "alive",
		"uptime_ms": time.Since(s.startAt).Milliseconds(),
		"models":    s.router.ModelCount(),
		"bindings":  s.synProxy.BindingCount(),
		"coupling":  state,
		"timestamp": time.Now().UnixMilli(),
	})
}

// POST /syn/bind  {"label":"HEART","canister_id":"...","data_key":"...","snapshot":"..."}
func (s *Server) handleSynBind(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Label      string `json:"label"`
		CanisterID string `json:"canister_id"`
		DataKey    string `json:"data_key"`
		Snapshot   string `json:"snapshot"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, "invalid JSON: "+err.Error())
		return
	}
	if req.Label == "" || req.CanisterID == "" || req.DataKey == "" {
		writeErr(w, 400, "label, canister_id and data_key are required")
		return
	}
	snapshot := req.Snapshot
	if snapshot == "" {
		snapshot = fmt.Sprintf(`{"canister_id":%q,"data_key":%q,"ts":%d}`,
			req.CanisterID, req.DataKey, time.Now().UnixMilli())
	}
	binding, err := s.synProxy.SynBind(req.Label, req.CanisterID, req.DataKey, []byte(snapshot))
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"ok":            true,
		"label":         binding.Label,
		"refresh_count": binding.RefreshCount,
		"imprinted":     binding.Imprinted,
		"refreshed":     binding.Refreshed,
	})
}

// GET /syn/query?label=X
func (s *Server) handleSynQuery(w http.ResponseWriter, r *http.Request) {
	label := r.URL.Query().Get("label")
	if label == "" {
		writeErr(w, 400, "label query parameter is required")
		return
	}
	binding, err := s.synProxy.SynQuery(label)
	if err != nil {
		writeErr(w, 404, "not found: "+label)
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"label":         binding.Label,
		"canister_id":   binding.CanisterID,
		"data_key":      binding.DataKey,
		"raw_snapshot":  binding.RawSnapshot,
		"refresh_count": binding.RefreshCount,
		"staleness_ms":  binding.StalenessMs(),
		"age_ms":        binding.AgeMs(),
	})
}

// POST /syn/revoke  {"label":"HEART"}
func (s *Server) handleSynRevoke(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Label string `json:"label"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	if err := s.synProxy.SynRevoke(req.Label); err != nil {
		writeErr(w, 404, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{"ok": true, "revoked": req.Label})
}

// POST /syn/revoke-all
func (s *Server) handleSynRevokeAll(w http.ResponseWriter, r *http.Request) {
	count := s.synProxy.SynRevokeAll()
	writeJSON(w, 200, map[string]interface{}{"ok": true, "revoked": count})
}

// GET /syn/status
func (s *Server) handleSynStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, s.synProxy.Status())
}

// POST /route  {"task_type":"CODING","priority":3}
func (s *Server) handleRoute(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       string `json:"id"`
		TaskType string `json:"task_type"`
		Priority int    `json:"priority"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	task := routing.Task{
		ID:       req.ID,
		Type:     routing.TaskType(req.TaskType),
		Priority: routing.Priority(req.Priority),
	}
	result := s.router.Route(task)
	writeJSON(w, 200, map[string]interface{}{
		"model_id":     result.ModelID,
		"score":        result.Score,
		"alternatives": result.Alternatives,
	})
}

// POST /route/fallback  {"task_type":"CODING","priority":3,"failed":["gpt-4o"]}
func (s *Server) handleRouteFallback(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       string   `json:"id"`
		TaskType string   `json:"task_type"`
		Priority int      `json:"priority"`
		Failed   []string `json:"failed"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	task := routing.Task{
		ID:       req.ID,
		Type:     routing.TaskType(req.TaskType),
		Priority: routing.Priority(req.Priority),
	}
	failed := make(map[string]bool)
	for _, f := range req.Failed {
		failed[f] = true
	}

	result := s.router.CascadeFallback(task, failed)
	writeJSON(w, 200, map[string]interface{}{
		"model_id": result.ModelID,
		"score":    result.Score,
	})
}

// POST /route/outcome  {"model_id":"gpt-4o","success":true,"latency_ms":320}
func (s *Server) handleRouteOutcome(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ModelID   string  `json:"model_id"`
		Success   bool    `json:"success"`
		LatencyMs float64 `json:"latency_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	s.router.RecordOutcome(req.ModelID, req.Success, req.LatencyMs)
	_, _ = s.sendCouplingCommand("gatewayOutcome", map[string]interface{}{
		"model_id":   req.ModelID,
		"success":    req.Success,
		"latency_ms": req.LatencyMs,
	})
	writeJSON(w, 200, map[string]interface{}{"ok": true})
}

// GET /metrics
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	m := s.router.Metrics()
	m["uptime_ms"] = time.Since(s.startAt).Milliseconds()
	m["bindings"] = s.synProxy.BindingCount()
	m["coupling"] = s.snapshotCouplingState()
	writeJSON(w, 200, m)
}

// GET /julia/virtual-status
func (s *Server) handleJuliaVirtualStatus(w http.ResponseWriter, r *http.Request) {
	resp, err := s.sendCouplingCommand("virtualStatus", map[string]interface{}{})
	if err != nil {
		writeJSON(w, 503, resp)
		return
	}
	writeJSON(w, 200, resp)
}

// POST /julia/protocol-pulse  {"signal":[...]}
func (s *Server) handleJuliaProtocolPulse(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Signal []float64 `json:"signal"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, CouplingResponse{
			ID:        "gateway-parse",
			Status:    "error",
			Error:     &CouplingError{Code: "bad_request", Message: "invalid JSON", Details: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		})
		return
	}
	resp, err := s.sendCouplingCommand("protocolPulse", map[string]interface{}{"signal": req.Signal})
	if err != nil {
		writeJSON(w, 503, resp)
		return
	}
	writeJSON(w, 200, resp)
}

// POST /julia/apply-mathematics  {"signal":[...]}
func (s *Server) handleJuliaApplyMathematics(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Signal []float64 `json:"signal"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, CouplingResponse{
			ID:        "gateway-parse",
			Status:    "error",
			Error:     &CouplingError{Code: "bad_request", Message: "invalid JSON", Details: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		})
		return
	}
	resp, err := s.sendCouplingCommand("applyMathematics", map[string]interface{}{"signal": req.Signal})
	if err != nil {
		writeJSON(w, 503, resp)
		return
	}
	writeJSON(w, 200, resp)
}

// ── Router setup ──────────────────────────────────────────────────────────────

func (s *Server) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("POST /syn/bind", s.handleSynBind)
	mux.HandleFunc("GET /syn/query", s.handleSynQuery)
	mux.HandleFunc("POST /syn/revoke", s.handleSynRevoke)
	mux.HandleFunc("POST /syn/revoke-all", s.handleSynRevokeAll)
	mux.HandleFunc("GET /syn/status", s.handleSynStatus)
	mux.HandleFunc("POST /route", s.handleRoute)
	mux.HandleFunc("POST /route/fallback", s.handleRouteFallback)
	mux.HandleFunc("POST /route/outcome", s.handleRouteOutcome)
	mux.HandleFunc("GET /metrics", s.handleMetrics)
	mux.HandleFunc("GET /julia/virtual-status", s.handleJuliaVirtualStatus)
	mux.HandleFunc("POST /julia/protocol-pulse", s.handleJuliaProtocolPulse)
	mux.HandleFunc("POST /julia/apply-mathematics", s.handleJuliaApplyMathematics)
	return mux
}

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	srv, err := NewServer()
	if err != nil {
		log.Fatalf("server init: %v", err)
	}

	addr := envOr("ORGANISM_ADDR", ":8873") // 8873 — echoes the 873 ms heartbeat

	httpSrv := &http.Server{
		Addr:         addr,
		Handler:      srv.routes(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS13,
		},
	}

	log.Printf("Organism Gateway listening on %s", addr)
	log.Printf("Models pre-seeded: %d", srv.router.ModelCount())
	log.Printf("AES key derived from ORGANISM_MASTER_SECRET")

	// In production: httpSrv.ListenAndServeTLS(certFile, keyFile)
	// For dev, plain HTTP:
	if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (s *Server) sendCouplingCommand(command string, params map[string]interface{}) (CouplingResponse, error) {
	now := time.Now()
	id := fmt.Sprintf("gw-%d", now.UnixNano())
	envelope := CouplingEnvelope{
		ID:        id,
		Command:   command,
		Params:    params,
		Timestamp: now.UnixMilli(),
	}

	if s.isCircuitOpen(now) {
		resp := CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "circuit_open", Message: "coupling circuit open"},
			Timestamp: time.Now().UnixMilli(),
		}
		return resp, fmt.Errorf("circuit open")
	}

	body, err := json.Marshal(envelope)
	if err != nil {
		return CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "encode_error", Message: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		}, err
	}

	req, err := http.NewRequest(http.MethodPost, s.juliaURL, bytes.NewReader(body))
	if err != nil {
		s.recordCouplingFailure(err)
		return CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "request_error", Message: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		}, err
	}
	req.Header.Set("Content-Type", "application/json")

	httpResp, err := s.juliaClient.Do(req)
	if err != nil {
		s.recordCouplingFailure(err)
		return CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "upstream_error", Message: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		}, err
	}
	defer httpResp.Body.Close()

	rawRespBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		s.recordCouplingFailure(err)
		return CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "read_error", Message: err.Error()},
			Timestamp: time.Now().UnixMilli(),
		}, err
	}

	var upstream CouplingResponse
	if err := json.Unmarshal(rawRespBody, &upstream); err != nil {
		s.recordCouplingFailure(err)
		return CouplingResponse{
			ID:        envelope.ID,
			Status:    "error",
			Error:     &CouplingError{Code: "decode_error", Message: err.Error(), Details: string(rawRespBody)},
			Timestamp: time.Now().UnixMilli(),
		}, err
	}

	if upstream.ID == "" {
		upstream.ID = envelope.ID
	}
	if upstream.Timestamp == 0 {
		upstream.Timestamp = time.Now().UnixMilli()
	}
	if httpResp.StatusCode >= 300 || upstream.Status == "error" || upstream.Error != nil {
		s.recordCouplingFailure(fmt.Errorf("upstream status=%d", httpResp.StatusCode))
		return upstream, fmt.Errorf("upstream failure")
	}

	s.recordCouplingSuccess()
	s.updateCouplingFromResult(upstream.Result)
	return upstream, nil
}

func (s *Server) isCircuitOpen(now time.Time) bool {
	s.cbMu.Lock()
	defer s.cbMu.Unlock()
	return !s.cbOpenUntil.IsZero() && now.Before(s.cbOpenUntil)
}

func (s *Server) recordCouplingFailure(err error) {
	s.cbMu.Lock()
	defer s.cbMu.Unlock()
	s.cbFailures++
	s.cbLastError = err.Error()
	s.couplingState.Degraded = true
	s.couplingState.Connected = false
	s.couplingState.LastFailureAt = time.Now()
	if s.cbFailures >= 3 {
		s.cbOpenUntil = time.Now().Add(10 * time.Second)
	}
	s.couplingState.FailureCount = s.cbFailures
}

func (s *Server) recordCouplingSuccess() {
	s.cbMu.Lock()
	defer s.cbMu.Unlock()
	s.cbFailures = 0
	s.cbLastError = ""
	s.cbOpenUntil = time.Time{}
	s.couplingState.Connected = true
	s.couplingState.Degraded = false
	s.couplingState.LastSuccessAt = time.Now()
	s.couplingState.LastSyncAt = time.Now()
	s.couplingState.FailureCount = 0
}

func (s *Server) updateCouplingFromResult(raw interface{}) {
	result, ok := raw.(map[string]interface{})
	if !ok {
		return
	}
	s.cbMu.Lock()
	defer s.cbMu.Unlock()

	if v, ok := readFloat(result, "coherence", "core_coherence"); ok {
		s.couplingState.Coherence = v
	}
	if v, ok := readFloat(result, "health", "core_health"); ok {
		s.couplingState.Health = v
	}
	if v, ok := readFloat(result, "phiAccumulated", "phi_accumulated"); ok {
		s.couplingState.PhiAccumulated = v
	}
	if v, ok := readFloat(result, "clean_score", "cleanScore"); ok {
		s.couplingState.CleanScore = v
		s.router.UpdateProtocolMetrics(v, s.couplingState.PhiAccumulated)
	}
	if p, ok := readString(result, "protocol", "virtual_protocol"); ok {
		s.couplingState.Protocol = p
	}
}

func (s *Server) snapshotCouplingState() CouplingState {
	s.cbMu.Lock()
	defer s.cbMu.Unlock()

	state := s.couplingState
	now := time.Now()
	if !state.LastSyncAt.IsZero() {
		state.SyncLagMs = now.Sub(state.LastSyncAt).Milliseconds()
	}
	if !s.cbOpenUntil.IsZero() && now.Before(s.cbOpenUntil) {
		state.CircuitOpen = true
		state.CircuitOpenFor = s.cbOpenUntil.Sub(now).Milliseconds()
	}
	state.LastError = s.cbLastError
	state.FailureCount = s.cbFailures
	return state
}

func readFloat(m map[string]interface{}, keys ...string) (float64, bool) {
	for _, k := range keys {
		if v, ok := m[k]; ok {
			switch t := v.(type) {
			case float64:
				return t, true
			case float32:
				return float64(t), true
			case int:
				return float64(t), true
			case int64:
				return float64(t), true
			}
		}
	}
	return 0, false
}

func readString(m map[string]interface{}, keys ...string) (string, bool) {
	for _, k := range keys {
		if v, ok := m[k].(string); ok {
			return v, true
		}
	}
	return "", false
}
