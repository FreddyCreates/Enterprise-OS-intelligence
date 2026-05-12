/**
 * RSHIP Phi Constants — Golden Ratio Mathematics
 * Medina Tech · RSHIP-2026 · Dallas, TX
 * 
 * φ (phi) constants used throughout the RSHIP organism
 */

// Golden Ratio
export const PHI = 1.618033988749895;
export const PHI_INV = 0.618033988749895;
export const PHI_SQUARED = PHI * PHI;            // φ² ≈ 2.618
export const PHI_CUBED = PHI * PHI * PHI;        // φ³ ≈ 4.236
export const PHI_FOURTH = PHI * PHI * PHI * PHI; // φ⁴ ≈ 6.854

// Schumann Resonance — Earth's fundamental frequency
export const SCHUMANN_HZ = 7.83;

// RSHIP Heartbeat (derived from Medina Field equations)
export const HEARTBEAT_MS = 873;

// φ-ladder frequencies (Hz)
export const PHI_FREQUENCIES = {
  base: PHI,          // φ Hz
  phi2: PHI_SQUARED,  // φ² Hz
  phi3: PHI_CUBED,    // φ³ Hz
  phi4: PHI_FOURTH,   // φ⁴ Hz
};

// Agent activation thresholds
export const ACTIVATION_THRESHOLD = 0.382; // 1 - PHI_INV
export const COHERENCE_THRESHOLD = 0.618;  // PHI_INV

export default {
  PHI,
  PHI_INV,
  PHI_SQUARED,
  PHI_CUBED,
  PHI_FOURTH,
  SCHUMANN_HZ,
  HEARTBEAT_MS,
  PHI_FREQUENCIES,
  ACTIVATION_THRESHOLD,
  COHERENCE_THRESHOLD,
};
