package composition

import "testing"

func TestRegisterAndLink(t *testing.T) {
	e := NewEngine()
	if err := e.RegisterProgram("meta-assist", "meta", 1.0); err != nil {
		t.Fatalf("register source: %v", err)
	}
	if err := e.RegisterProgram("meta-translate", "meta", 1.0); err != nil {
		t.Fatalf("register target: %v", err)
	}
	if err := e.LinkPrograms("meta-assist", "meta-translate", 3); err != nil {
		t.Fatalf("link: %v", err)
	}
	st := e.Status()
	if st["program_count"].(int) != 2 {
		t.Fatalf("expected 2 programs, got %v", st["program_count"])
	}
	if st["link_count"].(int) != 1 {
		t.Fatalf("expected 1 link, got %v", st["link_count"])
	}
}

func TestDiffuse(t *testing.T) {
	e := NewEngine()
	_ = e.RegisterProgram("a", "meta", 1.0)
	_ = e.RegisterProgram("b", "meta", 1.0)
	_ = e.RegisterProgram("c", "meta", 1.0)
	_ = e.LinkPrograms("a", "b", 1)
	_ = e.LinkPrograms("b", "c", 2)

	res, err := e.Diffuse("a", 1.0, 3)
	if err != nil {
		t.Fatalf("diffuse: %v", err)
	}
	if _, ok := res.Reached["a"]; !ok {
		t.Fatalf("source must be in reached map")
	}
	if _, ok := res.Reached["b"]; !ok {
		t.Fatalf("expected b in reached map")
	}
	if res.EdgeHops == 0 {
		t.Fatalf("expected positive edge hops")
	}
}

func TestDuplicateProgram(t *testing.T) {
	e := NewEngine()
	if err := e.RegisterProgram("x", "meta", 1.0); err != nil {
		t.Fatalf("register: %v", err)
	}
	if err := e.RegisterProgram("x", "meta", 1.0); err != ErrProgramExists {
		t.Fatalf("expected ErrProgramExists, got %v", err)
	}
}
