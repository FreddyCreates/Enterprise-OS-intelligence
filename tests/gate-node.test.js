/**
 * Gate-Node Worker Tests
 * Tests for cloudflare-workers/gate-node/worker.js - Routing logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simulate gate-node functions for testing
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const ROUTE_PATTERNS = {
  static: [
    /^\/favicon\.ico$/,
    /^\/robots\.txt$/,
    /^\/_assets\//,
    /^\/static\//,
  ],
  intelligence: [
    /^\/api\/ai\//,
    /^\/api\/intelligence\//,
    /^\/api\/analyze\//,
  ],
  learning: [
    /^\/api\/feedback\//,
    /^\/api\/learn\//,
  ],
};

const THREAT_PATTERNS = [
  /\.env$/,
  /\.git\//,
  /wp-admin/,
  /wp-login/,
  /\.php$/,
  /xmlrpc\.php/,
  /eval\(/,
  /base64_decode/,
];

function computeRouteHash(path, method) {
  let h = 0;
  const s = `${method}:${path}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(12, '0');
}

function classifyRequest(url, method) {
  const path = url.pathname;
  
  for (const pattern of THREAT_PATTERNS) {
    if (pattern.test(path)) {
      return { type: 'threat', pattern: pattern.toString() };
    }
  }
  
  for (const pattern of ROUTE_PATTERNS.static) {
    if (pattern.test(path)) {
      return { type: 'static', cached: true };
    }
  }
  
  for (const pattern of ROUTE_PATTERNS.intelligence) {
    if (pattern.test(path)) {
      return { type: 'intelligence', priority: 'high' };
    }
  }
  
  for (const pattern of ROUTE_PATTERNS.learning) {
    if (pattern.test(path)) {
      return { type: 'learning', track: true };
    }
  }
  
  return { type: 'organism', adaptive: true };
}

describe('Gate-Node Functions', () => {
  describe('computeRouteHash', () => {
    it('should produce consistent hash', () => {
      const hash1 = computeRouteHash('/api/test', 'GET');
      const hash2 = computeRouteHash('/api/test', 'GET');
      
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different paths', () => {
      const hash1 = computeRouteHash('/api/users', 'GET');
      const hash2 = computeRouteHash('/api/posts', 'GET');
      
      assert.notStrictEqual(hash1, hash2);
    });

    it('should produce different hashes for different methods', () => {
      const hashGet = computeRouteHash('/api/test', 'GET');
      const hashPost = computeRouteHash('/api/test', 'POST');
      
      assert.notStrictEqual(hashGet, hashPost);
    });

    it('should return 12 character hex string', () => {
      const hash = computeRouteHash('/test', 'GET');
      
      assert.strictEqual(hash.length, 12);
      assert.ok(/^[0-9a-f]+$/.test(hash));
    });

    it('should handle empty path', () => {
      const hash = computeRouteHash('', 'GET');
      assert.strictEqual(hash.length, 12);
    });

    it('should handle long paths', () => {
      const longPath = '/segment'.repeat(100);
      const hash = computeRouteHash(longPath, 'POST');
      
      assert.strictEqual(hash.length, 12);
    });
  });

  describe('classifyRequest', () => {
    describe('threat detection', () => {
      it('should detect .env as threat', () => {
        const url = new URL('http://example.com/config/.env');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect .git as threat', () => {
        const url = new URL('http://example.com/.git/config');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect wp-admin as threat', () => {
        const url = new URL('http://example.com/wp-admin');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect wp-login as threat', () => {
        const url = new URL('http://example.com/wp-login.php');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect .php files as threat', () => {
        const url = new URL('http://example.com/shell.php');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect xmlrpc.php as threat', () => {
        const url = new URL('http://example.com/xmlrpc.php');
        const result = classifyRequest(url, 'POST');
        
        assert.strictEqual(result.type, 'threat');
      });

      it('should detect eval( in path as threat', () => {
        const url = new URL('http://example.com/path?q=eval(test)');
        // Since we only check pathname, this won't match
        const result = classifyRequest(url, 'GET');
        assert.notStrictEqual(result.type, 'threat');
        
        // But this will:
        const url2 = new URL('http://example.com/path/eval(/test');
        const result2 = classifyRequest(url2, 'GET');
        assert.strictEqual(result2.type, 'threat');
      });

      it('should include pattern in threat response', () => {
        const url = new URL('http://example.com/.env');
        const result = classifyRequest(url, 'GET');
        
        assert.ok(result.pattern);
      });
    });

    describe('static pattern detection', () => {
      it('should detect favicon.ico as static', () => {
        const url = new URL('http://example.com/favicon.ico');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'static');
        assert.strictEqual(result.cached, true);
      });

      it('should detect robots.txt as static', () => {
        const url = new URL('http://example.com/robots.txt');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'static');
      });

      it('should detect _assets paths as static', () => {
        const url = new URL('http://example.com/_assets/style.css');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'static');
      });

      it('should detect static paths as static', () => {
        const url = new URL('http://example.com/static/image.png');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'static');
      });
    });

    describe('intelligence pattern detection', () => {
      it('should detect /api/ai/ as intelligence', () => {
        const url = new URL('http://example.com/api/ai/analyze');
        const result = classifyRequest(url, 'POST');
        
        assert.strictEqual(result.type, 'intelligence');
        assert.strictEqual(result.priority, 'high');
      });

      it('should detect /api/intelligence/ as intelligence', () => {
        const url = new URL('http://example.com/api/intelligence/status');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'intelligence');
      });

      it('should detect /api/analyze/ as intelligence', () => {
        const url = new URL('http://example.com/api/analyze/data');
        const result = classifyRequest(url, 'POST');
        
        assert.strictEqual(result.type, 'intelligence');
      });
    });

    describe('learning pattern detection', () => {
      it('should detect /api/feedback/ as learning', () => {
        const url = new URL('http://example.com/api/feedback/submit');
        const result = classifyRequest(url, 'POST');
        
        assert.strictEqual(result.type, 'learning');
        assert.strictEqual(result.track, true);
      });

      it('should detect /api/learn/ as learning', () => {
        const url = new URL('http://example.com/api/learn/pattern');
        const result = classifyRequest(url, 'POST');
        
        assert.strictEqual(result.type, 'learning');
      });
    });

    describe('organism routing', () => {
      it('should route unknown paths to organism', () => {
        const url = new URL('http://example.com/api/users');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'organism');
        assert.strictEqual(result.adaptive, true);
      });

      it('should route root to organism', () => {
        const url = new URL('http://example.com/');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'organism');
      });
    });

    describe('priority', () => {
      it('should prioritize threat over static', () => {
        // A .php file in static folder is still a threat
        const url = new URL('http://example.com/static/shell.php');
        const result = classifyRequest(url, 'GET');
        
        assert.strictEqual(result.type, 'threat');
      });
    });
  });

  describe('Constants', () => {
    it('PHI should be golden ratio', () => {
      assert.strictEqual(PHI, 1.618033988749895);
    });

    it('PHI_INV should be inverse golden ratio', () => {
      assert.ok(Math.abs(PHI_INV - (1 / PHI)) < 1e-10);
    });

    it('ROUTE_PATTERNS should have all categories', () => {
      assert.ok(Array.isArray(ROUTE_PATTERNS.static));
      assert.ok(Array.isArray(ROUTE_PATTERNS.intelligence));
      assert.ok(Array.isArray(ROUTE_PATTERNS.learning));
    });

    it('THREAT_PATTERNS should be non-empty array', () => {
      assert.ok(Array.isArray(THREAT_PATTERNS));
      assert.ok(THREAT_PATTERNS.length > 0);
    });
  });
});
