/**
 * JULIA ORGANISM BRIDGE SDK
 * JavaScript ↔ Julia Integration Layer
 *
 * Official Designation: RSHIP-2026-JULIA-BRIDGE-001
 * Classification: Cross-Language Organism Integration
 *
 * This SDK provides seamless integration between the JavaScript Organism
 * and the Julia engines, transformers, and synthesizers. Nothing is separate —
 * the bridge ensures both sides flow as one living system.
 *
 * Bridge Capabilities:
 * - State synchronization between JS and Julia
 * - Command dispatch to Julia engines
 * - Event propagation across language boundary
 * - φ-coherent data transformation
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const SCHUMANN_HZ = 7.83;

// Julia module path
const JULIA_MODULE_PATH = path.join(__dirname, '../../julia');

// ═══════════════════════════════════════════════════════════════════════════════
// JULIA BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JuliaBridge - Manages communication with Julia Organism
 */
class JuliaBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.id = `BRIDGE-${Date.now().toString(16)}`;
    this.designation = config.designation || 'RSHIP-JULIA-BRIDGE';
    
    // Julia process
    this.juliaProcess = null;
    this.isConnected = false;
    
    // State sync
    this.lastSyncTime = 0;
    this.syncInterval = config.syncInterval || 1000 / SCHUMANN_HZ;
    
    // Message queue
    this.messageQueue = [];
    this.pendingResponses = new Map();
    
    // φ-properties
    this.phiAccumulated = 0;
    
    // Configuration
    this.juliaPath = config.juliaPath || 'julia';
    this.modulePath = config.modulePath || JULIA_MODULE_PATH;
    this.virtualMode = config.virtualMode !== false;
  }
  
  /**
   * Initialize connection to Julia Organism
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // Spawn the live Julia server script
        const serverScript = path.join(this.modulePath, 'server.jl');
        const spawnArgs = [
          '--project=' + this.modulePath,
          serverScript,
          this.designation
        ];

        if (this.virtualMode) {
          spawnArgs.push('--virtual');
        }

        this.juliaProcess = spawn(this.juliaPath, spawnArgs, {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle stdout
        let buffer = '';
        let resolved = false;
        this.juliaProcess.stdout.on('data', (data) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line === 'JULIA_READY' || line === 'JULIA_VIRTUAL_READY') {
              this.isConnected = true;
              this.emit('connected');
              if (!resolved) {
                resolved = true;
                resolve({ status: 'connected', id: this.id });
              }
            } else if (line.trim()) {
              try {
                const response = JSON.parse(line);
                this.handleResponse(response);
              } catch (e) {
                this.emit('rawOutput', line);
              }
            }
          }
        });
        
        // Handle stderr
        this.juliaProcess.stderr.on('data', (data) => {
          const message = data.toString();
          // Julia may print package/precompile info to stderr; surface as diagnostic, not fatal.
          this.emit('stderr', { type: 'stderr', message });
        });
        
        // Handle process exit
        this.juliaProcess.on('exit', (code) => {
          this.isConnected = false;
          this.emit('disconnected', { code });
        });
        
        // Handle process error
        this.juliaProcess.on('error', (err) => {
          this.isConnected = false;
          reject(err);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from Julia Organism
   */
  disconnect() {
    if (this.juliaProcess) {
      this.juliaProcess.kill();
      this.juliaProcess = null;
      this.isConnected = false;
    }
  }
  
  /**
   * Send command to Julia
   */
  async sendCommand(command, params = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to Julia');
    }
    
    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const message = {
      id: messageId,
      command,
      params,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      this.pendingResponses.set(messageId, { resolve, reject, timestamp: Date.now() });
      
      const json = JSON.stringify(message);
      this.juliaProcess.stdin.write(json + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingResponses.has(messageId)) {
          this.pendingResponses.delete(messageId);
          reject(new Error('Command timeout'));
        }
      }, 30000);
    });
  }
  
  /**
   * Handle response from Julia
   */
  handleResponse(response) {
    if (response.id && this.pendingResponses.has(response.id)) {
      const pending = this.pendingResponses.get(response.id);
      this.pendingResponses.delete(response.id);
      
      if (response.error) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response);
      }
    } else {
      this.emit('message', response);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANISM OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Pulse the Julia Organism
   */
  async pulse() {
    return this.sendCommand('pulse');
  }
  
  /**
   * Breathe the Julia Organism
   */
  async breathe() {
    return this.sendCommand('breathe');
  }
  
  /**
   * Process signal through Julia pipeline
   */
  async processSignal(signal) {
    return this.sendCommand('processSignal', { signal });
  }
  
  /**
   * Transform data using specified Julia transformer
   */
  async transformData(data, transformType) {
    return this.sendCommand('transformData', { data, transformType });
  }
  
  /**
   * Synthesize knowledge in Julia
   */
  async synthesizeKnowledge() {
    return this.sendCommand('synthesizeKnowledge');
  }
  
  /**
   * Get Julia Organism status
   */
  async getStatus() {
    return this.sendCommand('status');
  }
  
  /**
   * Get full diagnostic from Julia
   */
  async getDiagnostic() {
    return this.sendCommand('fullDiagnostic');
  }

  /**
   * Get virtual server protocol status
   */
  async getVirtualStatus() {
    return this.sendCommand('virtualStatus');
  }

  /**
   * Pulse the virtual protocol explicitly
   */
  async protocolPulse(signal = []) {
    return this.sendCommand('protocolPulse', { signal });
  }

  /**
   * Apply own mathematics transform on signal
   */
  async applyMathematics(signal) {
    return this.sendCommand('applyMathematics', { signal });
  }
  
  /**
   * Export Julia state for JS consumption
   */
  async exportState() {
    return this.sendCommand('exportState');
  }
  
  /**
   * Import JS state into Julia
   */
  async importState(jsState) {
    return this.sendCommand('importState', { state: jsState });
  }
  
  /**
   * Synchronize states bidirectionally
   */
  async synchronize(jsOrganism) {
    // Export Julia state
    const juliaState = await this.exportState();
    
    // Import JS state to Julia
    const jsState = jsOrganism.exportState ? jsOrganism.exportState() : {
      coherence: jsOrganism.coherence || 1.0,
      health: jsOrganism.health || 1.0,
      phiAccumulated: jsOrganism.phiAccumulated || 0
    };
    await this.importState(jsState);
    
    // Update JS from Julia
    if (jsOrganism.importState) {
      jsOrganism.importState(juliaState);
    }
    
    this.lastSyncTime = Date.now();
    this.phiAccumulated += PHI_INV * 0.001;
    
    return {
      status: 'synchronized',
      timestamp: this.lastSyncTime,
      juliaState,
      jsState
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JULIA COMMAND BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JuliaCommandBuilder - Fluent API for Julia commands
 */
class JuliaCommandBuilder {
  constructor(bridge) {
    this.bridge = bridge;
    this.commands = [];
  }
  
  pulse() {
    this.commands.push({ type: 'pulse' });
    return this;
  }
  
  breathe() {
    this.commands.push({ type: 'breathe' });
    return this;
  }
  
  processSignal(signal) {
    this.commands.push({ type: 'processSignal', signal });
    return this;
  }
  
  transform(data, type) {
    this.commands.push({ type: 'transform', data, transformType: type });
    return this;
  }
  
  synthesize() {
    this.commands.push({ type: 'synthesize' });
    return this;
  }
  
  async execute() {
    const results = [];
    
    for (const cmd of this.commands) {
      let result;
      switch (cmd.type) {
        case 'pulse':
          result = await this.bridge.pulse();
          break;
        case 'breathe':
          result = await this.bridge.breathe();
          break;
        case 'processSignal':
          result = await this.bridge.processSignal(cmd.signal);
          break;
        case 'transform':
          result = await this.bridge.transformData(cmd.data, cmd.transformType);
          break;
        case 'synthesize':
          result = await this.bridge.synthesizeKnowledge();
          break;
      }
      results.push(result);
    }
    
    this.commands = [];
    return results;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK JULIA BRIDGE (for environments without Julia)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MockJuliaBridge - Simulates Julia Organism for testing/fallback
 */
class MockJuliaBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.id = `MOCK-BRIDGE-${Date.now().toString(16)}`;
    this.designation = config.designation || 'MOCK-JULIA-BRIDGE';
    this.isConnected = false;
    
    // Mock state
    this.state = {
      heartbeatCount: 0,
      coherence: 1.0,
      health: 1.0,
      phiAccumulated: 0,
      orderParameter: 1.0,
      sovereigntyScore: 1.0,
      nCrystals: 0
    };
  }
  
  async connect() {
    this.isConnected = true;
    this.emit('connected');
    return { status: 'connected', id: this.id, mock: true };
  }
  
  disconnect() {
    this.isConnected = false;
    this.emit('disconnected');
  }
  
  async pulse() {
    this.state.heartbeatCount++;
    this.state.phiAccumulated += PHI_INV * 0.001;
    
    // Simulate oscillation
    const t = this.state.heartbeatCount * (1 / SCHUMANN_HZ);
    this.state.coherence = 0.8 + 0.2 * Math.sin(2 * Math.PI * SCHUMANN_HZ * t);
    this.state.orderParameter = PHI_INV + (1 - PHI_INV) * Math.abs(Math.sin(t));
    
    return {
      status: 'pulsed',
      heartbeat: this.state.heartbeatCount,
      coherence: this.state.coherence,
      orderParameter: this.state.orderParameter,
      phiAccumulated: this.state.phiAccumulated
    };
  }
  
  async breathe() {
    this.state.health = Math.min(1.0, this.state.health + 0.01 * PHI_INV);
    return { status: 'breathed', health: this.state.health };
  }
  
  async processSignal(signal) {
    // Simple mock processing
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + (b - mean) ** 2, 0) / signal.length;
    
    return {
      status: 'processed',
      mean,
      variance,
      coherence: this.state.coherence,
      emergence: variance > PHI ? 1 : 0
    };
  }
  
  async transformData(data, transformType) {
    // Simple transforms
    if (transformType === 'phi') {
      return data.map(x => x * PHI);
    } else if (transformType === 'coherence') {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      return data.map(x => PHI_INV * x + (1 - PHI_INV) * mean);
    }
    return data;
  }
  
  async synthesizeKnowledge() {
    this.state.nCrystals++;
    return {
      success: true,
      coherence: this.state.coherence,
      nCrystals: this.state.nCrystals
    };
  }
  
  async getStatus() {
    return { ...this.state };
  }
  
  async getDiagnostic() {
    return {
      organism: this.state,
      mock: true
    };
  }

  async getVirtualStatus() {
    return {
      protocol: 'RSHIP-CLEAN-MOCK-PROTOCOL',
      clean_score: Math.max(0, Math.min(1, this.state.coherence * this.state.health)),
      pulse_count: this.state.heartbeatCount,
      coherence: this.state.coherence,
      health: this.state.health,
      phiAccumulated: this.state.phiAccumulated
    };
  }

  async protocolPulse(signal = []) {
    await this.pulse();
    const mapped = signal.map((x, i) => PHI_INV * x + (1 - PHI_INV) * Math.sin(i + this.state.heartbeatCount));
    return {
      status: 'pulsed',
      signal: mapped,
      clean_score: Math.max(0, Math.min(1, this.state.coherence * this.state.health)),
      pulse_count: this.state.heartbeatCount
    };
  }

  async applyMathematics(signal = []) {
    return {
      status: 'mathematics_applied',
      signal: signal.map((x, i) => x * PHI + Math.sin(i * SCHUMANN_HZ) * PHI_INV),
      phi: PHI,
      phiInv: PHI_INV,
      schumannHz: SCHUMANN_HZ
    };
  }
  
  async exportState() {
    return { ...this.state, timestamp: Date.now() };
  }
  
  async importState(jsState) {
    if (jsState.coherence !== undefined) {
      this.state.coherence = PHI_INV * this.state.coherence + (1 - PHI_INV) * jsState.coherence;
    }
    if (jsState.health !== undefined) {
      this.state.health = jsState.health;
    }
    return { status: 'imported' };
  }
  
  async synchronize(jsOrganism) {
    const juliaState = await this.exportState();
    const jsState = jsOrganism.exportState ? jsOrganism.exportState() : {};
    await this.importState(jsState);
    return { status: 'synchronized', juliaState, jsState };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a Julia Bridge (real or mock based on environment)
 */
async function createJuliaBridge(config = {}) {
  if (config.mock === true) {
    const bridge = new MockJuliaBridge(config);
    await bridge.connect();
    return bridge;
  }
  
  const bridge = new JuliaBridge(config);
  
  try {
    await bridge.connect();
    return bridge;
  } catch (error) {
    // Fall back to mock if Julia not available
    console.warn('Julia not available, using mock bridge:', error.message);
    const mockBridge = new MockJuliaBridge(config);
    await mockBridge.connect();
    return mockBridge;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  JuliaBridge,
  MockJuliaBridge,
  JuliaCommandBuilder,
  createJuliaBridge,
  PHI,
  PHI_INV,
  SCHUMANN_HZ
};
