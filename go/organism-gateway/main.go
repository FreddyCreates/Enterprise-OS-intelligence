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
//   GET  /julia/virtual-status — Julia coupling virtual status
//   POST /julia/protocol-pulse — Julia protocol pulse
//   POST /julia/apply-mathematics — Julia apply mathematics
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
router      *routing.ModelRouter
synProxy    *syn.SynProxy
memStore    *memory.Store
pulseM      *pulse.Monitor
divMgr      *division.DivisionManager
compEng     *composition.Engine
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

pulseMon := pulse.New()
memStore := memory.New(aesKey, 4096)
divMgr := division.NewDivisionManager(aesKey[:])
compEng := composition.NewEngine()

return &Server{
router:      routing.NewModelRouter(),
synProxy:    syn.NewSynProxy(aesKey),
memStore:    memStore,
pulseM:      pulseMon,
divMgr:      divMgr,
compEng:     compEng,
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
"ok":      true,
"label":   binding.Label,
"hash":    binding.Hash,
"created": binding.CreatedAt.UnixMilli(),
})
}

// GET /syn/query?label=HEART
func (s *Server) handleSynQuery(w http.ResponseWriter, r *http.Request) {
label := r.URL.Query().Get("label")
if label == "" {
writeErr(w, 400, "label query parameter is required")
return
}
binding, err := s.synProxy.SynQuery(label)
if err != nil {
writeErr(w, 404, err.Error())
return
}
writeJSON(w, 200, map[string]interface{}{
"label":       binding.Label,
"canister_id": binding.CanisterID,
"data_key":    binding.DataKey,
"hash":        binding.Hash,
"created":     binding.CreatedAt.UnixMilli(),
"snapshot":    string(binding.Snapshot),
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
if req.Label == "" {
writeErr(w, 400, "label is required")
return
}
ok := s.synProxy.SynRevoke(req.Label)
writeJSON(w, 200, map[string]interface{}{"ok": ok, "label": req.Label})
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

// POST /route  {"prompt":"...","models":["gpt-4","claude-3"],"phi_weight":0.7}
func (s *Server) handleRoute(w http.ResponseWriter, r *http.Request) {
var req struct {
Prompt    string   `json:"prompt"`
Models    []string `json:"models"`
PhiWeight float64  `json:"phi_weight"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeErr(w, 400, err.Error())
return
}
if len(req.Models) == 0 {
writeErr(w, 400, "models array is required")
return
}
result := s.router.Route(req.Prompt, req.Models, req.PhiWeight)
writeJSON(w, 200, result)
}

// POST /route/fallback  {"prompt":"...","cascade":["gpt-4","claude-3","llama-3"]}
func (s *Server) handleRouteFallback(w http.ResponseWriter, r *http.Request) {
var req struct {
Prompt  string   `json:"prompt"`
Cascade []string `json:"cascade"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeErr(w, 400, err.Error())
return
}
if len(req.Cascade) == 0 {
writeErr(w, 400, "cascade array is required")
return
}
result := s.router.RouteFallback(req.Prompt, req.Cascade)
writeJSON(w, 200, result)
}

// POST /route/outcome  {"model":"gpt-4","latency_ms":123,"success":true}
func (s *Server) handleRouteOutcome(w http.ResponseWriter, r *http.Request) {
var req struct {
Model     string  `json:"model"`
LatencyMs float64 `json:"latency_ms"`
Success   bool    `json:"success"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeErr(w, 400, err.Error())
return
}
s.router.RecordOutcome(req.Model, req.LatencyMs, req.Success)
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
if err := s.divMgr.Boot(); err != nil {
writeErr(w, 500, err.Error())
return
}
writeJSON(w, 200, map[string]interface{}{"ok": true, "status": s.divMgr.Status()})
}

// POST /division/tick
func (s *Server) handleDivisionTick(w http.ResponseWriter, r *http.Request) {
if err := s.divMgr.Tick(); err != nil {
writeErr(w, 500, err.Error())
return
}
writeJSON(w, 200, map[string]interface{}{"ok": true, "status": s.divMgr.Status()})
}

// GET /division/status
func (s *Server) handleDivisionStatus(w http.ResponseWriter, r *http.Request) {
writeJSON(w, 200, s.divMgr.Status())
}

// ── Composition handlers ──────────────────────────────────────────────────────

// POST /composition/register  {"id":"node-1","type":"processor","metadata":{...}}
func (s *Server) handleCompositionRegister(w http.ResponseWriter, r *http.Request) {
var req struct {
ID       string                 `json:"id"`
Type     string                 `json:"type"`
Metadata map[string]interface{} `json:"metadata"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeErr(w, 400, err.Error())
return
}
node, err := s.compEng.Register(req.ID, req.Type, req.Metadata)
if err != nil {
writeErr(w, 400, err.Error())
return
}
writeJSON(w, 200, node)
}

// POST /composition/link  {"from":"node-1","to":"node-2","weight":0.8}
func (s *Server) handleCompositionLink(w http.ResponseWriter, r *http.Request) {
var req struct {
From   string  `json:"from"`
To     string  `json:"to"`
Weight float64 `json:"weight"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeErr(w, 400, err.Error())
return
}
edge, err := s.compEng.Link(req.From, req.To, req.Weight)
if err != nil {
writeErr(w, 400, err.Error())
return
}
writeJSON(w, 200, edge)
}

// POST /composition/diffuse  {"source":"node-1","signal":1.0,"steps":3}
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

// ── Julia coupling handlers ───────────────────────────────────────────────────

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
// Julia coupling
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
