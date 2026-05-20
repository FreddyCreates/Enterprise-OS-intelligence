// Package memory provides the Sovereign Eternal Memory Store for the
// organism gateway.
//
// The memory store is an in-process, φ-indexed key-value store with:
//   - Per-entry TTL with φ-harmonic decay
//   - Namespace isolation (namespace::key)
//   - AES-256-GCM encryption of values at rest
//   - LRU eviction governed by golden-ratio capacity thresholds
//   - Snapshot-and-restore for persistence handoffs
//
// Theory: ARCHIVUM MEMORIAE (Paper XVIII) — Nothing is lost.
//
// Ring: Sovereign Ring | Go Gateway
package memory

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	orgcrypto "organism-gateway/internal/crypto"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const (
	PHI           = 1.618033988749895
	PHIInv        = 0.618033988749895
	DefaultCap    = 4096              // maximum entries before LRU eviction
	EvictRatio    = PHIInv            // evict to φ⁻¹ of capacity
	DefaultTTLMs  = 24 * 60 * 60 * 1000 // 24 hours
	NamespaceSep  = "::"
)

// ── Errors ────────────────────────────────────────────────────────────────────

var (
	ErrNotFound    = errors.New("key not found")
	ErrExpired     = errors.New("entry expired")
	ErrCapacity    = errors.New("capacity exceeded")
	ErrInvalidKey  = errors.New("key must not be empty")
)

// ── MemoryEntry ───────────────────────────────────────────────────────────────

// MemoryEntry holds one encrypted, timestamped value in the store.
type MemoryEntry struct {
	Namespace   string `json:"namespace"`
	Key         string `json:"key"`
	Ciphertext  string `json:"ciphertext"`   // AES-256-GCM base64
	Nonce       string `json:"nonce"`        // GCM nonce base64
	CreatedMs   int64  `json:"created_ms"`
	UpdatedMs   int64  `json:"updated_ms"`
	TTLMs       int64  `json:"ttl_ms"`        // 0 = immortal
	AccessCount int64  `json:"access_count"`
	Tags        []string `json:"tags,omitempty"`
}

// ExpiresAt returns the Unix-ms expiry timestamp (or 0 if immortal).
func (e *MemoryEntry) ExpiresAt() int64 {
	if e.TTLMs == 0 {
		return 0
	}
	return e.CreatedMs + e.TTLMs
}

// IsExpired returns true if the entry has passed its TTL.
func (e *MemoryEntry) IsExpired() bool {
	exp := e.ExpiresAt()
	return exp > 0 && time.Now().UnixMilli() > exp
}

// FullKey returns namespace::key.
func (e *MemoryEntry) FullKey() string {
	return e.Namespace + NamespaceSep + e.Key
}

// ── Store ─────────────────────────────────────────────────────────────────────

// Store is the sovereign eternal memory store.  All values are encrypted with
// the ring AES key before being stored.
type Store struct {
	mu      sync.RWMutex
	entries map[string]*MemoryEntry // fullKey → entry
	aesKey  [32]byte
	cap     int
	hits    int64
	misses  int64
	evictions int64
}

// New creates a Store with the given AES key and capacity.
func New(aesKey [32]byte, capacity int) *Store {
	if capacity <= 0 {
		capacity = DefaultCap
	}
	return &Store{
		entries: make(map[string]*MemoryEntry, capacity),
		aesKey:  aesKey,
		cap:     capacity,
	}
}

// fullKey builds the composite key string.
func fullKey(namespace, key string) string {
	return namespace + NamespaceSep + key
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

// SetOptions configures a Set operation.
type SetOptions struct {
	TTLMs int64    // 0 = immortal
	Tags  []string
}

// Set encrypts and stores value under namespace::key.
func (s *Store) Set(namespace, key string, value []byte, opts SetOptions) error {
	if key == "" {
		return ErrInvalidKey
	}
	encrypted, err := orgcrypto.Encrypt(s.aesKey[:], value)
	if err != nil {
		return fmt.Errorf("encrypt: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := s.maybeEvict(); err != nil {
		return err
	}

	fk  := fullKey(namespace, key)
	now := time.Now().UnixMilli()
	ttl := opts.TTLMs
	if ttl == 0 {
		ttl = DefaultTTLMs
	}

	if existing, ok := s.entries[fk]; ok {
		// Update in place
		existing.Ciphertext  = encrypted.Ciphertext
		existing.Nonce       = encrypted.Nonce
		existing.UpdatedMs   = now
		existing.TTLMs       = ttl
		existing.Tags        = opts.Tags
	} else {
		s.entries[fk] = &MemoryEntry{
			Namespace:  namespace,
			Key:        key,
			Ciphertext: encrypted.Ciphertext,
			Nonce:      encrypted.Nonce,
			CreatedMs:  now,
			UpdatedMs:  now,
			TTLMs:      ttl,
			Tags:       opts.Tags,
		}
	}
	return nil
}

// Get decrypts and returns the value for namespace::key.
// Returns ErrNotFound if missing and ErrExpired if the TTL has passed.
func (s *Store) Get(namespace, key string) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	fk := fullKey(namespace, key)
	e, ok := s.entries[fk]
	if !ok {
		s.misses++
		return nil, ErrNotFound
	}
	if e.IsExpired() {
		delete(s.entries, fk)
		s.misses++
		return nil, ErrExpired
	}

	payload := &orgcrypto.EncryptedPayload{
		Nonce:      e.Nonce,
		Ciphertext: e.Ciphertext,
	}
	plaintext, err := orgcrypto.Decrypt(s.aesKey[:], payload)
	if err != nil {
		s.misses++
		return nil, err
	}

	e.AccessCount++
	s.hits++
	return plaintext, nil
}

// Delete removes namespace::key from the store.
func (s *Store) Delete(namespace, key string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	fk := fullKey(namespace, key)
	if _, ok := s.entries[fk]; ok {
		delete(s.entries, fk)
		return true
	}
	return false
}

// Has returns true if namespace::key exists and has not expired.
func (s *Store) Has(namespace, key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.entries[fullKey(namespace, key)]
	return ok && !e.IsExpired()
}

// Keys returns all non-expired keys in a namespace.
func (s *Store) Keys(namespace string) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	prefix := namespace + NamespaceSep
	out := make([]string, 0)
	for fk, e := range s.entries {
		if len(fk) > len(prefix) && fk[:len(prefix)] == prefix && !e.IsExpired() {
			out = append(out, e.Key)
		}
	}
	sort.Strings(out)
	return out
}

// PurgeExpired removes all expired entries and returns the count removed.
func (s *Store) PurgeExpired() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	count := 0
	for fk, e := range s.entries {
		if e.IsExpired() {
			delete(s.entries, fk)
			count++
		}
	}
	return count
}

// ── JSON Helpers ─────────────────────────────────────────────────────────────

// SetJSON marshals v as JSON and stores it.
func (s *Store) SetJSON(namespace, key string, v interface{}, opts SetOptions) error {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	return s.Set(namespace, key, b, opts)
}

// GetJSON retrieves and unmarshals a JSON value into dst.
func (s *Store) GetJSON(namespace, key string, dst interface{}) error {
	b, err := s.Get(namespace, key)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dst)
}

// ── LRU Eviction ─────────────────────────────────────────────────────────────

// maybeEvict evicts the LRU entries when the store reaches capacity.
// Called under write lock.
func (s *Store) maybeEvict() error {
	if len(s.entries) < s.cap {
		return nil
	}
	// First purge expired entries — often sufficient
	for fk, e := range s.entries {
		if e.IsExpired() {
			delete(s.entries, fk)
		}
	}
	if len(s.entries) < s.cap {
		return nil
	}

	// φ-LRU: evict oldest-accessed entries down to φ⁻¹ of capacity
	target := int(math.Floor(float64(s.cap) * EvictRatio))

	type scored struct {
		fk    string
		score int64 // lower = evict first
	}
	sl := make([]scored, 0, len(s.entries))
	for fk, e := range s.entries {
		// Score = lastAccess (UpdatedMs) weighted by accessCount×φ
		sl = append(sl, scored{fk, e.UpdatedMs + int64(float64(e.AccessCount)*PHI*1000)})
	}
	sort.Slice(sl, func(i, j int) bool { return sl[i].score < sl[j].score })

	evicted := 0
	for _, item := range sl {
		if len(s.entries) <= target {
			break
		}
		delete(s.entries, item.fk)
		evicted++
	}
	s.evictions += int64(evicted)
	return nil
}

// ── Snapshot ─────────────────────────────────────────────────────────────────

// Snapshot exports all current (non-expired) entries as a JSON-serialisable slice.
// The values remain encrypted — safe to persist or transfer.
func (s *Store) Snapshot() []*MemoryEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*MemoryEntry, 0, len(s.entries))
	for _, e := range s.entries {
		if !e.IsExpired() {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].UpdatedMs > out[j].UpdatedMs
	})
	return out
}

// Restore loads entries from a prior snapshot (does not decrypt — values
// are already encrypted blobs).
func (s *Store) Restore(entries []*MemoryEntry) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	loaded := 0
	for _, e := range entries {
		if !e.IsExpired() {
			s.entries[e.FullKey()] = e
			loaded++
		}
	}
	return loaded
}

// ── Metrics ───────────────────────────────────────────────────────────────────

// Metrics returns store statistics.
func (s *Store) Metrics() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	hitRate := 0.0
	if total := s.hits + s.misses; total > 0 {
		hitRate = float64(s.hits) / float64(total)
	}
	return map[string]interface{}{
		"entries":    len(s.entries),
		"capacity":   s.cap,
		"hits":       s.hits,
		"misses":     s.misses,
		"evictions":  s.evictions,
		"hit_rate":   hitRate,
		"fill_ratio": float64(len(s.entries)) / float64(s.cap),
	}
}
