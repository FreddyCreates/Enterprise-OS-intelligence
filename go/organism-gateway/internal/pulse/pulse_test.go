package pulse

import (
	"testing"
	"time"
)

func TestNew(t *testing.T) {
	m := New()
	if m == nil {
		t.Fatal("New returned nil")
	}
	if len(m.components) != 5 {
		t.Fatalf("expected 5 components, got %d", len(m.components))
	}
}

func TestPingUpdatesState(t *testing.T) {
	m := New()
	m.Ping(ComponentSYN, 42.0)
	m.mu.RLock()
	c := m.components[ComponentSYN]
	m.mu.RUnlock()
	if c.State != StateAlive {
		t.Errorf("expected alive, got %s", c.State)
	}
	if c.LatencyMs != 42.0*PHIInv {
		// initial latency is 0, so EMA = PHIInv*42 + (1-PHIInv)*0
		expected := PHIInv * 42.0
		if c.LatencyMs != expected {
			t.Errorf("latency EMA mismatch: got %v, want %v", c.LatencyMs, expected)
		}
	}
}

func TestRecordError(t *testing.T) {
	m := New()
	// Force degraded: need >= floor(φ⁻¹×10) = 6 errors
	for i := 0; i < 6; i++ {
		m.RecordError(ComponentRouter)
	}
	m.mu.RLock()
	c := m.components[ComponentRouter]
	m.mu.RUnlock()
	if c.State != StateDegraded && c.State != StateDead {
		t.Errorf("expected degraded or dead after 6 errors, got %s", c.State)
	}
}

func TestRecover(t *testing.T) {
	m := New()
	for i := 0; i < 20; i++ {
		m.RecordError(ComponentCrypto)
	}
	m.Recover(ComponentCrypto)
	m.mu.RLock()
	c := m.components[ComponentCrypto]
	m.mu.RUnlock()
	if c.State != StateAlive {
		t.Errorf("expected alive after recover, got %s", c.State)
	}
	if c.ErrorCount != 0 {
		t.Errorf("expected zero error count after recover, got %d", c.ErrorCount)
	}
}

func TestVitalityScore(t *testing.T) {
	m := New()
	v := m.VitalityScore()
	if v <= 0 || v > 1 {
		t.Errorf("vitality out of [0,1]: %v", v)
	}
}

func TestStatus(t *testing.T) {
	m := New()
	s := m.Status()
	if s["level"] == nil {
		t.Error("status missing level")
	}
	if s["beat"] == nil {
		t.Error("status missing beat")
	}
}

func TestBeatIncrements(t *testing.T) {
	m := New()
	m.Run()
	time.Sleep(HeartbeatMS*2*time.Millisecond + 50*time.Millisecond)
	m.Stop()
	if m.Beat() < 1 {
		t.Errorf("expected at least 1 beat, got %d", m.Beat())
	}
}

func TestOnBeatHook(t *testing.T) {
	m := New()
	var called int
	m.OnBeat(func(beat uint64, vitality float64) {
		called++
	})
	m.Run()
	time.Sleep(HeartbeatMS*3*time.Millisecond + 50*time.Millisecond)
	m.Stop()
	if called < 2 {
		t.Errorf("expected at least 2 hook calls, got %d", called)
	}
}
