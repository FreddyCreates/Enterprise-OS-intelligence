// Package composition provides a lightweight organism composition diffusion
// engine for the Go gateway.
//
// It models a directed graph of organisms/programs and diffuses a signal from
// one source across graph edges with φ-harmonic attenuation and Fibonacci
// coupling multipliers.
//
// Ring: Interface Ring | Go Gateway
package composition

import (
	"errors"
	"math"
	"sync"
	"time"
)

const (
	PHI    = 1.618033988749895
	PHIInv = 0.618033988749895
)

var (
	ErrProgramExists   = errors.New("program already exists")
	ErrProgramNotFound = errors.New("program not found")
	ErrInvalidLink     = errors.New("invalid link")
	ErrInvalidSource   = errors.New("invalid source")
)

// Program is one composition node.
type Program struct {
	ID        string  `json:"id"`
	Kind      string  `json:"kind"`
	Weight    float64 `json:"weight"`
	CreatedMs int64   `json:"created_ms"`
}

// Link represents one directed coupling edge.
type Link struct {
	From        string `json:"from"`
	To          string `json:"to"`
	CouplingFib int    `json:"coupling_fib"`
	CreatedMs   int64  `json:"created_ms"`
}

// DiffusionResult contains one diffusion execution output.
type DiffusionResult struct {
	Source      string             `json:"source"`
	Signal      float64            `json:"signal"`
	Steps       int                `json:"steps"`
	Reached     map[string]float64 `json:"reached"`
	EdgeHops    int                `json:"edge_hops"`
	TimestampMs int64              `json:"timestamp_ms"`
}

// Engine stores graph state and executes diffusion.
type Engine struct {
	mu sync.RWMutex

	programs map[string]Program
	adj      map[string][]Link

	diffusions int64
	last       *DiffusionResult
}

func NewEngine() *Engine {
	return &Engine{
		programs: make(map[string]Program),
		adj:      make(map[string][]Link),
	}
}

func (e *Engine) RegisterProgram(id, kind string, weight float64) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if id == "" {
		return ErrProgramNotFound
	}
	if _, ok := e.programs[id]; ok {
		return ErrProgramExists
	}
	if weight <= 0 {
		weight = 1.0
	}
	e.programs[id] = Program{
		ID:        id,
		Kind:      kind,
		Weight:    weight,
		CreatedMs: time.Now().UnixMilli(),
	}
	return nil
}

func (e *Engine) LinkPrograms(from, to string, couplingFib int) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if from == "" || to == "" || from == to {
		return ErrInvalidLink
	}
	if _, ok := e.programs[from]; !ok {
		return ErrProgramNotFound
	}
	if _, ok := e.programs[to]; !ok {
		return ErrProgramNotFound
	}
	if couplingFib <= 0 {
		couplingFib = 1
	}
	e.adj[from] = append(e.adj[from], Link{
		From:        from,
		To:          to,
		CouplingFib: couplingFib,
		CreatedMs:   time.Now().UnixMilli(),
	})
	return nil
}

func fib(n int) int {
	if n <= 0 {
		return 0
	}
	if n <= 2 {
		return 1
	}
	a, b := 1, 1
	for i := 3; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

// Diffuse propagates a signal from source for N steps.
// Per hop attenuation:
//
//	next = current × φ⁻¹ × (nodeWeight / fib(coupling))
func (e *Engine) Diffuse(source string, signal float64, steps int) (DiffusionResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if _, ok := e.programs[source]; !ok {
		return DiffusionResult{}, ErrInvalidSource
	}
	if signal <= 0 {
		signal = 1.0
	}
	if steps <= 0 {
		steps = 1
	}

	reached := map[string]float64{source: signal}
	current := map[string]float64{source: signal}
	edgeHops := 0

	for i := 0; i < steps; i++ {
		next := make(map[string]float64)
		for node, value := range current {
			for _, edge := range e.adj[node] {
				p := e.programs[edge.To]
				hop := value * PHIInv * (p.Weight / math.Max(1, float64(fib(edge.CouplingFib))))
				if hop <= 0 {
					continue
				}
				next[edge.To] += hop
				reached[edge.To] += hop
				edgeHops++
			}
		}
		if len(next) == 0 {
			break
		}
		current = next
	}

	res := DiffusionResult{
		Source:      source,
		Signal:      signal,
		Steps:       steps,
		Reached:     reached,
		EdgeHops:    edgeHops,
		TimestampMs: time.Now().UnixMilli(),
	}
	e.last = &res
	e.diffusions++
	return res, nil
}

func (e *Engine) Status() map[string]interface{} {
	e.mu.RLock()
	defer e.mu.RUnlock()

	linkCount := 0
	for _, ls := range e.adj {
		linkCount += len(ls)
	}
	out := map[string]interface{}{
		"program_count": len(e.programs),
		"link_count":    linkCount,
		"diffusions":    e.diffusions,
	}
	if e.last != nil {
		out["last"] = e.last
	}
	return out
}
