// Package composition manages composition components, links, and signal diffusion.
package composition

import (
	"fmt"
	"sync"
	"time"
)

type Component struct {
	ComponentID  string                 `json:"component_id"`
	Role         string                 `json:"role"`
	Metadata     map[string]interface{} `json:"metadata"`
	RegisteredAt int64                  `json:"registered_at"`
}

type Link struct {
	FromComponentID string  `json:"from_component_id"`
	ToComponentID   string  `json:"to_component_id"`
	Relation        string  `json:"relation"`
	Weight          float64 `json:"weight"`
	LinkedAt        int64   `json:"linked_at"`
}

type DiffusionEvent struct {
	Signal     string  `json:"signal"`
	Scope      string  `json:"scope"`
	TargetRole string  `json:"target_role,omitempty"`
	Intensity  float64 `json:"intensity"`
	Impacted   int     `json:"impacted"`
	DiffusedAt int64   `json:"diffused_at"`
}

type Manager struct {
	mu         sync.RWMutex
	components map[string]Component
	links      []Link
	diffusions []DiffusionEvent
}

func NewManager() *Manager {
	return &Manager{
		components: make(map[string]Component),
		links:      make([]Link, 0),
		diffusions: make([]DiffusionEvent, 0),
	}
}

func (m *Manager) Register(componentID, role string, metadata map[string]interface{}) (Component, error) {
	if componentID == "" || role == "" {
		return Component{}, fmt.Errorf("component_id and role are required")
	}
	if metadata == nil {
		metadata = map[string]interface{}{}
	}

	c := Component{
		ComponentID:  componentID,
		Role:         role,
		Metadata:     metadata,
		RegisteredAt: time.Now().UnixMilli(),
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.components[componentID] = c
	return c, nil
}

func (m *Manager) LinkComponents(fromComponentID, toComponentID, relation string, weight float64) (Link, error) {
	if fromComponentID == "" || toComponentID == "" {
		return Link{}, fmt.Errorf("from_component_id and to_component_id are required")
	}
	if fromComponentID == toComponentID {
		return Link{}, fmt.Errorf("cannot link component to itself")
	}
	if relation == "" {
		relation = "connected"
	}
	if weight <= 0 {
		weight = 1.0
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.components[fromComponentID]; !ok {
		return Link{}, fmt.Errorf("from_component_id not registered: %s", fromComponentID)
	}
	if _, ok := m.components[toComponentID]; !ok {
		return Link{}, fmt.Errorf("to_component_id not registered: %s", toComponentID)
	}

	l := Link{
		FromComponentID: fromComponentID,
		ToComponentID:   toComponentID,
		Relation:        relation,
		Weight:          weight,
		LinkedAt:        time.Now().UnixMilli(),
	}
	m.links = append(m.links, l)
	return l, nil
}

func (m *Manager) Diffuse(signal, scope, targetRole string, intensity float64) (DiffusionEvent, error) {
	if signal == "" {
		return DiffusionEvent{}, fmt.Errorf("signal is required")
	}
	if scope == "" {
		scope = "all"
	}
	if intensity <= 0 {
		intensity = 1.0
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	impacted := 0
	switch scope {
	case "all":
		impacted = len(m.components)
	case "role":
		if targetRole == "" {
			return DiffusionEvent{}, fmt.Errorf("target_role is required when scope=role")
		}
		for _, c := range m.components {
			if c.Role == targetRole {
				impacted++
			}
		}
	default:
		return DiffusionEvent{}, fmt.Errorf("invalid scope: %s", scope)
	}

	event := DiffusionEvent{
		Signal:     signal,
		Scope:      scope,
		TargetRole: targetRole,
		Intensity:  intensity,
		Impacted:   impacted,
		DiffusedAt: time.Now().UnixMilli(),
	}
	m.diffusions = append(m.diffusions, event)
	return event, nil
}

func (m *Manager) Status() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	components := make([]Component, 0, len(m.components))
	for _, c := range m.components {
		components = append(components, c)
	}

	return map[string]interface{}{
		"components":      components,
		"links":           m.links,
		"diffusions":      m.diffusions,
		"component_count": len(components),
		"link_count":      len(m.links),
		"diffusion_count": len(m.diffusions),
	}
}
