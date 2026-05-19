// Package pulse provides the Organism Heartbeat & Vitality Monitor for the
// organism gateway.
//
// Every living organism requires continuous vital-sign monitoring.  The pulse
// package ticks at the canonical 873 ms heartbeat interval and exposes a
// real-time health dashboard: rings alive, beat counter, φ-harmonic vitality
// score, and per-component liveness flags.
//
// Theory: SUBSTRATE VIVENS (Paper I) — Five properties of a living substrate.
//
// Ring: Sovereign Ring | Go Gateway
package pulse

import (
	"math"
	"sync"
	"time"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const (
	HeartbeatMS  = 873   // canonical organism heartbeat
	HeartbeatHz  = 1000.0 / HeartbeatMS
	PHI          = 1.618033988749895
	PHIInv       = 0.618033988749895
	SchumannHz   = 7.83  // Earth resonance reference
	VitalityFloor = 0.382 // φ⁻² — below this is critical
	VitalityTarget = PHIInv // φ⁻¹ — operating health target
)

// ── Component ─────────────────────────────────────────────────────────────────

// ComponentName identifies a monitored subsystem.
type ComponentName string

const (
	ComponentSYN      ComponentName = "syn"
	ComponentRouter   ComponentName = "router"
	ComponentDivision ComponentName = "division"
	ComponentMemory   ComponentName = "memory"
	ComponentCrypto   ComponentName = "crypto"
)

// LivenessState describes a component's current health.
type LivenessState string

const (
	StateAlive    LivenessState = "alive"
	StateDegraded LivenessState = "degraded"
	StateDead     LivenessState = "dead"
)

// ComponentHealth holds one component's monitoring snapshot.
type ComponentHealth struct {
	Name       ComponentName `json:"name"`
	State      LivenessState `json:"state"`
	LastPingMs int64         `json:"last_ping_ms"` // Unix ms of last check-in
	LatencyMs  float64       `json:"latency_ms"`
	ErrorCount int64         `json:"error_count"`
}

// VitalityScore computes a 0..1 health score using φ-harmonic decay.
//
// score = exp(-k × errorCount) × ageFactor
// where k = φ⁻¹ and ageFactor decays toward φ-floor after 10 min.
func (c *ComponentHealth) VitalityScore() float64 {
	// Error penalty: each error decays score by φ⁻¹
	errorPenalty := math.Exp(-PHIInv * float64(c.ErrorCount))
	// Freshness: full score if pinged within last 30 s
	ageMs := time.Now().UnixMilli() - c.LastPingMs
	freshness := math.Exp(-float64(ageMs) / 30_000.0)
	return errorPenalty * freshness
}

// ── Monitor ───────────────────────────────────────────────────────────────────

// Monitor is the organism's heartbeat engine.  Call Run() to start the
// background tick goroutine; call Stop() to halt it cleanly.
type Monitor struct {
	mu         sync.RWMutex
	components map[ComponentName]*ComponentHealth
	beat       uint64
	startAt    time.Time
	ticker     *time.Ticker
	done       chan struct{}
	hooks      []func(beat uint64, vitality float64)
}

// New creates a Monitor with all built-in components registered.
func New() *Monitor {
	m := &Monitor{
		components: make(map[ComponentName]*ComponentHealth),
		startAt:    time.Now(),
		done:       make(chan struct{}),
	}
	for _, name := range []ComponentName{
		ComponentSYN, ComponentRouter, ComponentDivision,
		ComponentMemory, ComponentCrypto,
	} {
		m.components[name] = &ComponentHealth{
			Name:       name,
			State:      StateAlive,
			LastPingMs: time.Now().UnixMilli(),
		}
	}
	return m
}

// Run starts the heartbeat ticker.  Non-blocking — spawns a goroutine.
func (m *Monitor) Run() {
	m.ticker = time.NewTicker(HeartbeatMS * time.Millisecond)
	go func() {
		for {
			select {
			case <-m.ticker.C:
				m.tick()
			case <-m.done:
				m.ticker.Stop()
				return
			}
		}
	}()
}

// Stop halts the heartbeat ticker.
func (m *Monitor) Stop() {
	close(m.done)
}

// OnBeat registers a hook called on every heartbeat with the beat number
// and current organism vitality score.
func (m *Monitor) OnBeat(fn func(beat uint64, vitality float64)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.hooks = append(m.hooks, fn)
}

// Ping records a successful check-in for a component.
func (m *Monitor) Ping(name ComponentName, latencyMs float64) {
	m.mu.Lock()
	defer m.mu.Unlock()
	c, ok := m.components[name]
	if !ok {
		return
	}
	c.LastPingMs = time.Now().UnixMilli()
	c.LatencyMs  = PHIInv*latencyMs + (1-PHIInv)*c.LatencyMs // φ-EMA
	c.State      = StateAlive
}

// RecordError increments the error counter and may mark a component degraded.
func (m *Monitor) RecordError(name ComponentName) {
	m.mu.Lock()
	defer m.mu.Unlock()
	c, ok := m.components[name]
	if !ok {
		return
	}
	c.ErrorCount++
	// Degraded at φ⁻¹×10 errors, dead at φ×10
	switch {
	case c.ErrorCount >= 16: // floor(φ×10) = 16
		c.State = StateDead
	case c.ErrorCount >= 6:  // floor(φ⁻¹×10) = 6
		c.State = StateDegraded
	}
}

// Recover resets a component's error count and marks it alive.
func (m *Monitor) Recover(name ComponentName) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if c, ok := m.components[name]; ok {
		c.ErrorCount = 0
		c.State      = StateAlive
		c.LastPingMs = time.Now().UnixMilli()
	}
}

// Beat returns the current heartbeat count.
func (m *Monitor) Beat() uint64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.beat
}

// VitalityScore returns the organism-level φ-harmonic vitality (0..1).
func (m *Monitor) VitalityScore() float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.vitalityLocked()
}

func (m *Monitor) vitalityLocked() float64 {
	if len(m.components) == 0 {
		return 0
	}
	total := 0.0
	// Weight components by ring importance using Fibonacci proportions
	weights := map[ComponentName]float64{
		ComponentCrypto:   PHI * PHI,   // φ² — sovereign ring
		ComponentSYN:      PHI,         // φ  — intelligence ring
		ComponentRouter:   1.0,         // 1  — interface ring
		ComponentDivision: PHIInv,      // φ⁻¹
		ComponentMemory:   PHIInv * PHIInv, // φ⁻²
	}
	weightSum := 0.0
	for name, c := range m.components {
		w := weights[name]
		if w == 0 { w = 1 }
		total     += w * c.VitalityScore()
		weightSum += w
	}
	return total / weightSum
}

// Status returns a complete health snapshot suitable for JSON serialisation.
func (m *Monitor) Status() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	vitality := m.vitalityLocked()
	level := "nominal"
	switch {
	case vitality < VitalityFloor:
		level = "critical"
	case vitality < VitalityTarget:
		level = "degraded"
	}

	comps := make(map[string]interface{}, len(m.components))
	for name, c := range m.components {
		comps[string(name)] = map[string]interface{}{
			"state":        c.State,
			"vitality":     c.VitalityScore(),
			"latency_ms":   c.LatencyMs,
			"error_count":  c.ErrorCount,
			"last_ping_ms": c.LastPingMs,
		}
	}

	return map[string]interface{}{
		"beat":          m.beat,
		"uptime_ms":     time.Since(m.startAt).Milliseconds(),
		"vitality":      vitality,
		"level":         level,
		"heartbeat_hz":  HeartbeatHz,
		"schumann_hz":   SchumannHz,
		"components":    comps,
	}
}

func (m *Monitor) tick() {
	m.mu.Lock()
	m.beat++
	beat     := m.beat
	vitality := m.vitalityLocked()
	hooks    := m.hooks
	m.mu.Unlock()

	for _, fn := range hooks {
		fn(beat, vitality)
	}
}
