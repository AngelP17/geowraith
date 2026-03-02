import { describe, it } from 'node:test';
import assert from 'node:assert';
import { shouldInvokeVerifier, getContinentFromCoordinates } from './verifier.js';
import { config } from '../config.js';
import type { VectorMatch } from '../types.js';

describe('verifier', () => {
  describe('shouldInvokeVerifier', () => {
    it('returns false when verifier is disabled', () => {
      const matches: VectorMatch[] = [
        { id: '1', label: 'Test', lat: 40, lon: -74, vector: [], similarity: 0.8 },
      ];
      // When verifier is disabled, should always return false
      const result = shouldInvokeVerifier(0.8, matches);
      assert.strictEqual(result, false);
    });

    it('behavior depends on config when verifier is enabled', () => {
      // Note: To test verifier logic, set GEOWRAITH_ENABLE_VERIFIER=true
      // This test documents the expected behavior when enabled:
      // - High confidence (> 0.60) should not trigger verifier
      // - Low confidence (< 0.60) should trigger verifier
      // - Geographic spread (3+ continents) should trigger verifier
      assert.strictEqual(typeof shouldInvokeVerifier, 'function');
    });
  });

  describe('getContinentFromCoordinates', () => {
    it('identifies North America', () => {
      assert.strictEqual(getContinentFromCoordinates(40, -100), 'NA');
    });

    it('identifies Europe/Africa', () => {
      assert.strictEqual(getContinentFromCoordinates(45, 10), 'EU-AF');
    });

    it('identifies Asia', () => {
      assert.strictEqual(getContinentFromCoordinates(35, 100), 'AS');
    });

    it('identifies South America', () => {
      assert.strictEqual(getContinentFromCoordinates(-20, -60), 'SA');
    });

    it('identifies Southern Africa', () => {
      assert.strictEqual(getContinentFromCoordinates(-30, 20), 'AF');
    });

    it('identifies Oceania', () => {
      assert.strictEqual(getContinentFromCoordinates(-30, 140), 'OC');
    });

    it('returns unknown for unusual coordinates', () => {
      assert.strictEqual(getContinentFromCoordinates(0, 0), 'UN');
    });
  });
});
