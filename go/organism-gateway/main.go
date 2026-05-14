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
//   GET  /pulse               — organism vitality & heartbeat status
//   POST /pulse/ping          — record a component liveness ping
//   POST /memory/set          — store a value in sovereign memory
//   GET  /memory/get          — retrieve a value from sovereign memory
//   GET  /memory/keys         — list keys in a namespace
//   DELETE /memory/delete     — delete a key
//   GET  /memory/metrics      — memory store statistics
//   POST /division/boot       — boot the AI division (all teams)
//   POST /division/tick       — tick all team cycle engines
//   GET  /division/status     — division metrics
//   POST /composition/register — register a composition node
//   POST /composition/link     — create a directed composition edge
//   POST /composition/diffuse  — diffuse a signal across composition graph
//   GET  /composition/status   — composition graph and diffusion metrics
//
// Ring: Interface Ring | Go Gateway

package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"organism-gateway/internal/composition"
	orgcrypto "organism-gateway/internal/crypto"
	"organism-gateway/internal/division"
	"organism-gateway/internal/memory"
	"organism-gateway/internal/pulse"
	"organism-gateway/internal/routing"
	"organism-gateway/internal/syn"
)

// ── Server ────────────────────────────────────────────────────────────────────

type Server struct {
	router   *routing.ModelRouter
	synProxy *syn.SynProxy
	memStore *memory.Store
	pulseM   *pulse.Monitor
	divMgr   *division.DivisionManager
	compEng  *composition.Engine
	aesKey   [32]byte
	startAt  time.Time
}

func NewServer() (*Server, error) {
	// Derive the ring AES key from environment variables (or a default for dev)
	masterSecret := envOr("ORGANISM_MASTER_SECRET", "dev-master-secret-change-in-prod")
	salt := envOr("ORGANISM_KEY_SALT", "organism-gateway-salt-v1")
	aesKey, err := orgcrypto.DeriveKey([]byte(masterSecret), []byte(salt), []byte("organism-aes-key-v1"))
	if err != nil {
		return nil, fmt.Errorf("derive AES key: %w", err)
	}

	pulseMon := pulse.New()
	memStore := memory.New(aesKey, 4096)
	divMgr := division.NewDivisionManager(aesKey[:])
	compEng := composition.NewEngine()

	return &Server{
		router:   routing.NewModelRouter(),
		synProxy: syn.NewSynProxy(aesKey),
		memStore: memStore,
		pulseM:   pulseMon,
		divMgr:   divMgr,
		compEng:  compEng,
		aesKey:   aesKey,
		startAt:  time.Now(),
	}, nil
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]interface{}{
		"status":    "alive",
		"uptime_ms": time.Since(s.startAt).Milliseconds(),
		"models":    s.router.ModelCount(),
		"bindings":  s.synProxy.BindingCount(),
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
	writeJSON(w, 200, map[string]interface{}{"ok": true})
}

// GET /metrics
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	m := s.router.Metrics()
	m["uptime_ms"] = time.Since(s.startAt).Milliseconds()
	m["bindings"] = s.synProxy.BindingCount()
	writeJSON(w, 200, m)
}

// ── Pulse handlers ────────────────────────────────────────────────────────────

// GET /pulse
func (s *Server) handlePulse(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, s.pulseM.Status())
}

// POST /pulse/ping  {"component":"syn","latency_ms":12.3}
func (s *Server) handlePulsePing(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Component string  `json:"component"`
		LatencyMs float64 `json:"latency_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	s.pulseM.Ping(pulse.ComponentName(req.Component), req.LatencyMs)
	writeJSON(w, 200, map[string]interface{}{"ok": true, "beat": s.pulseM.Beat()})
}

// ── Memory handlers ───────────────────────────────────────────────────────────

// POST /memory/set  {"namespace":"rship","key":"config","value":"...","ttl_ms":86400000}
func (s *Server) handleMemorySet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Namespace string   `json:"namespace"`
		Key       string   `json:"key"`
		Value     string   `json:"value"`
		TTLMs     int64    `json:"ttl_ms"`
		Tags      []string `json:"tags"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	if req.Key == "" {
		writeErr(w, 400, "key is required")
		return
	}
	ns := req.Namespace
	if ns == "" {
		ns = "default"
	}
	opts := memory.SetOptions{TTLMs: req.TTLMs, Tags: req.Tags}
	if err := s.memStore.Set(ns, req.Key, []byte(req.Value), opts); err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{"ok": true, "namespace": ns, "key": req.Key})
}

// GET /memory/get?namespace=rship&key=config
func (s *Server) handleMemoryGet(w http.ResponseWriter, r *http.Request) {
	ns := r.URL.Query().Get("namespace")
	key := r.URL.Query().Get("key")
	if key == "" {
		writeErr(w, 400, "key query parameter is required")
		return
	}
	if ns == "" {
		ns = "default"
	}
	val, err := s.memStore.Get(ns, key)
	if err != nil {
		code := 404
		if err == memory.ErrExpired {
			code = 410
		}
		writeErr(w, code, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"namespace": ns,
		"key":       key,
		"value":     string(val),
	})
}

// GET /memory/keys?namespace=rship
func (s *Server) handleMemoryKeys(w http.ResponseWriter, r *http.Request) {
	ns := r.URL.Query().Get("namespace")
	if ns == "" {
		ns = "default"
	}
	writeJSON(w, 200, map[string]interface{}{
		"namespace": ns,
		"keys":      s.memStore.Keys(ns),
	})
}

// DELETE /memory/delete?namespace=rship&key=config
func (s *Server) handleMemoryDelete(w http.ResponseWriter, r *http.Request) {
	ns := r.URL.Query().Get("namespace")
	key := r.URL.Query().Get("key")
	if key == "" {
		writeErr(w, 400, "key is required")
		return
	}
	if ns == "" {
		ns = "default"
	}
	deleted := s.memStore.Delete(ns, key)
	writeJSON(w, 200, map[string]interface{}{"ok": deleted, "namespace": ns, "key": key})
}

// GET /memory/metrics
func (s *Server) handleMemoryMetrics(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, s.memStore.Metrics())
}

// ── Division handlers ─────────────────────────────────────────────────────────

// POST /division/boot
func (s *Server) handleDivisionBoot(w http.ResponseWriter, r *http.Request) {
	s.divMgr.Boot()
	writeJSON(w, 200, map[string]interface{}{
		"ok":     true,
		"teams":  len(s.divMgr.Teams),
		"booted": s.divMgr.Booted,
	})
}

// POST /division/tick
func (s *Server) handleDivisionTick(w http.ResponseWriter, r *http.Request) {
	if !s.divMgr.Booted {
		s.divMgr.Boot()
	}
	beat := s.divMgr.TickAll()
	writeJSON(w, 200, map[string]interface{}{
		"global_beat":  beat,
		"total_tokens": s.divMgr.TotalTokens(),
		"total_boxes":  s.divMgr.TotalBoxes(),
		"fcpr":         s.divMgr.TotalFCPR(),
	})
}

// GET /division/status
func (s *Server) handleDivisionStatus(w http.ResponseWriter, r *http.Request) {
	teams := make(map[string]interface{})
	for role, team := range s.divMgr.Teams {
		teams[string(role)] = map[string]interface{}{
			"level":          team.Level,
			"capacity":       team.Capacity,
			"total_tokens":   team.Engine.TotalTokens,
			"surplus_cycles": team.Engine.SurplusCycles,
			"total_boxes":    team.Generator.TotalMinted,
			"fcpr":           team.Engine.FCPR(),
		}
	}
	writeJSON(w, 200, map[string]interface{}{
		"booted":       s.divMgr.Booted,
		"global_beat":  s.divMgr.GlobalBeat,
		"total_tokens": s.divMgr.TotalTokens(),
		"total_boxes":  s.divMgr.TotalBoxes(),
		"total_fcpr":   s.divMgr.TotalFCPR(),
		"teams":        teams,
	})
}

// ── Composition handlers ───────────────────────────────────────────────────────

// POST /composition/register {"id":"meta-assist","kind":"meta","weight":1.0}
func (s *Server) handleCompositionRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID     string  `json:"id"`
		Kind   string  `json:"kind"`
		Weight float64 `json:"weight"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	if req.ID == "" {
		writeErr(w, 400, "id is required")
		return
	}
	if err := s.compEng.RegisterProgram(req.ID, req.Kind, req.Weight); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{"ok": true, "id": req.ID})
}

// POST /composition/link {"from":"meta-a","to":"meta-b","coupling_fib":3}
func (s *Server) handleCompositionLink(w http.ResponseWriter, r *http.Request) {
	var req struct {
		From        string `json:"from"`
		To          string `json:"to"`
		CouplingFib int    `json:"coupling_fib"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	if err := s.compEng.LinkPrograms(req.From, req.To, req.CouplingFib); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{"ok": true, "from": req.From, "to": req.To})
}

// POST /composition/diffuse {"source":"meta-a","signal":1.0,"steps":3}
func (s *Server) handleCompositionDiffuse(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Source string  `json:"source"`
		Signal float64 `json:"signal"`
		Steps  int     `json:"steps"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	res, err := s.compEng.Diffuse(req.Source, req.Signal, req.Steps)
	if err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	writeJSON(w, 200, res)
}

// GET /composition/status
func (s *Server) handleCompositionStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, s.compEng.Status())
}

// ── Router setup ──────────────────────────────────────────────────────────────

func (s *Server) routes() *http.ServeMux {
	mux := http.NewServeMux()
	// Core
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("GET /metrics", s.handleMetrics)
	// SYN bindings
	mux.HandleFunc("POST /syn/bind", s.handleSynBind)
	mux.HandleFunc("GET /syn/query", s.handleSynQuery)
	mux.HandleFunc("POST /syn/revoke", s.handleSynRevoke)
	mux.HandleFunc("POST /syn/revoke-all", s.handleSynRevokeAll)
	mux.HandleFunc("GET /syn/status", s.handleSynStatus)
	// Model routing
	mux.HandleFunc("POST /route", s.handleRoute)
	mux.HandleFunc("POST /route/fallback", s.handleRouteFallback)
	mux.HandleFunc("POST /route/outcome", s.handleRouteOutcome)
	// Pulse / vitality
	mux.HandleFunc("GET /pulse", s.handlePulse)
	mux.HandleFunc("POST /pulse/ping", s.handlePulsePing)
	// Sovereign memory
	mux.HandleFunc("POST /memory/set", s.handleMemorySet)
	mux.HandleFunc("GET /memory/get", s.handleMemoryGet)
	mux.HandleFunc("GET /memory/keys", s.handleMemoryKeys)
	mux.HandleFunc("DELETE /memory/delete", s.handleMemoryDelete)
	mux.HandleFunc("GET /memory/metrics", s.handleMemoryMetrics)
	// Division
	mux.HandleFunc("POST /division/boot", s.handleDivisionBoot)
	mux.HandleFunc("POST /division/tick", s.handleDivisionTick)
	mux.HandleFunc("GET /division/status", s.handleDivisionStatus)
	// Composition
	mux.HandleFunc("POST /composition/register", s.handleCompositionRegister)
	mux.HandleFunc("POST /composition/link", s.handleCompositionLink)
	mux.HandleFunc("POST /composition/diffuse", s.handleCompositionDiffuse)
	mux.HandleFunc("GET /composition/status", s.handleCompositionStatus)
	return mux
}

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	srv, err := NewServer()
	if err != nil {
		log.Fatalf("server init: %v", err)
	}

	// Start the organism heartbeat monitor
	srv.pulseM.Run()
	srv.pulseM.OnBeat(func(beat uint64, vitality float64) {
		if beat%100 == 0 {
			log.Printf("[pulse] beat=%d vitality=%.4f", beat, vitality)
		}
	})

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
	log.Printf("Pulse monitor: running at %.2f Hz", pulse.HeartbeatHz)
	log.Printf("Memory store: capacity=%d", 4096)

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
