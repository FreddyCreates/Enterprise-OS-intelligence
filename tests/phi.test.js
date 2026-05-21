/**
 * Phi Constants Tests
 * Tests for src/constants/phi.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
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
} from '../src/constants/phi.js';

describe('Phi Constants', () => {
  describe('Golden Ratio', () => {
    it('PHI should be approximately 1.618033988749895', () => {
      assert.strictEqual(PHI, 1.618033988749895);
    });

    it('PHI_INV should be approximately 0.618033988749895', () => {
      assert.strictEqual(PHI_INV, 0.618033988749895);
    });

    it('PHI * PHI_INV should equal 1', () => {
      const product = PHI * PHI_INV;
      assert.ok(Math.abs(product - 1) < 1e-10, `Expected ~1, got ${product}`);
    });

    it('PHI - PHI_INV should equal 1', () => {
      const diff = PHI - PHI_INV;
      assert.ok(Math.abs(diff - 1) < 1e-10, `Expected ~1, got ${diff}`);
    });

    it('1 / PHI should equal PHI_INV', () => {
      const computed = 1 / PHI;
      assert.ok(Math.abs(computed - PHI_INV) < 1e-10);
    });
  });

  describe('Phi Powers', () => {
    it('PHI_SQUARED should equal PHI * PHI', () => {
      const expected = PHI * PHI;
      assert.strictEqual(PHI_SQUARED, expected);
    });

    it('PHI_CUBED should equal PHI * PHI * PHI', () => {
      const expected = PHI * PHI * PHI;
      assert.strictEqual(PHI_CUBED, expected);
    });

    it('PHI_FOURTH should equal PHI * PHI * PHI * PHI', () => {
      const expected = PHI * PHI * PHI * PHI;
      assert.strictEqual(PHI_FOURTH, expected);
    });

    it('PHI_SQUARED should be approximately 2.618', () => {
      assert.ok(PHI_SQUARED > 2.617 && PHI_SQUARED < 2.619);
    });

    it('PHI_CUBED should be approximately 4.236', () => {
      assert.ok(PHI_CUBED > 4.235 && PHI_CUBED < 4.237);
    });

    it('PHI_FOURTH should be approximately 6.854', () => {
      assert.ok(PHI_FOURTH > 6.853 && PHI_FOURTH < 6.856);
    });
  });

  describe('Fibonacci Property', () => {
    it('PHI^2 should equal PHI + 1', () => {
      const phiPlusOne = PHI + 1;
      assert.ok(Math.abs(PHI_SQUARED - phiPlusOne) < 1e-10);
    });

    it('PHI should satisfy x^2 = x + 1', () => {
      const lhs = PHI * PHI;
      const rhs = PHI + 1;
      assert.ok(Math.abs(lhs - rhs) < 1e-10);
    });
  });

  describe('Natural Constants', () => {
    it('SCHUMANN_HZ should be 7.83', () => {
      assert.strictEqual(SCHUMANN_HZ, 7.83);
    });

    it('HEARTBEAT_MS should be 873', () => {
      assert.strictEqual(HEARTBEAT_MS, 873);
    });

    it('SCHUMANN_HZ should be Earth resonance frequency', () => {
      // Schumann resonance is between 7.5 and 8.0 Hz
      assert.ok(SCHUMANN_HZ >= 7.5 && SCHUMANN_HZ <= 8.0);
    });
  });

  describe('PHI Frequencies', () => {
    it('should have base frequency equal to PHI', () => {
      assert.strictEqual(PHI_FREQUENCIES.base, PHI);
    });

    it('should have phi2 equal to PHI_SQUARED', () => {
      assert.strictEqual(PHI_FREQUENCIES.phi2, PHI_SQUARED);
    });

    it('should have phi3 equal to PHI_CUBED', () => {
      assert.strictEqual(PHI_FREQUENCIES.phi3, PHI_CUBED);
    });

    it('should have phi4 equal to PHI_FOURTH', () => {
      assert.strictEqual(PHI_FREQUENCIES.phi4, PHI_FOURTH);
    });

    it('frequencies should form a geometric sequence', () => {
      const ratio1 = PHI_FREQUENCIES.phi2 / PHI_FREQUENCIES.base;
      const ratio2 = PHI_FREQUENCIES.phi3 / PHI_FREQUENCIES.phi2;
      const ratio3 = PHI_FREQUENCIES.phi4 / PHI_FREQUENCIES.phi3;
      
      assert.ok(Math.abs(ratio1 - PHI) < 1e-10);
      assert.ok(Math.abs(ratio2 - PHI) < 1e-10);
      assert.ok(Math.abs(ratio3 - PHI) < 1e-10);
    });
  });

  describe('Thresholds', () => {
    it('ACTIVATION_THRESHOLD should be approximately 1 - PHI_INV', () => {
      const expected = 1 - PHI_INV;
      // Actual value is rounded to 0.382 for simplicity
      assert.ok(Math.abs(ACTIVATION_THRESHOLD - expected) < 0.001);
    });

    it('ACTIVATION_THRESHOLD should be approximately 0.382', () => {
      assert.ok(ACTIVATION_THRESHOLD > 0.381 && ACTIVATION_THRESHOLD < 0.383);
    });

    it('COHERENCE_THRESHOLD should be approximately PHI_INV', () => {
      // Actual value is rounded to 0.618 for simplicity
      assert.ok(Math.abs(COHERENCE_THRESHOLD - PHI_INV) < 0.001);
    });

    it('COHERENCE_THRESHOLD should be approximately 0.618', () => {
      assert.ok(COHERENCE_THRESHOLD > 0.617 && COHERENCE_THRESHOLD < 0.619);
    });

    it('ACTIVATION_THRESHOLD + COHERENCE_THRESHOLD should equal 1', () => {
      const sum = ACTIVATION_THRESHOLD + COHERENCE_THRESHOLD;
      assert.strictEqual(sum, 1);
    });
  });
});
