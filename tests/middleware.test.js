/**
 * Middleware Tests
 * Tests for functions/_middleware.js - Visitor classification and caching
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simulate middleware functions for testing
const PHI = 1.618033988749895;

const HOSTILE_PATTERNS = ['.git', '.env', 'wp-admin', 'xmlrpc', 'phpmyadmin', '.htaccess'];
const SCANNER_SIGNATURES = ['leakix', 'nuclei', 'sqlmap', 'nikto', 'nmap', 'masscan'];
const AI_SIGNATURES = ['claude', 'anthropic', 'gpt', 'openai', 'googlebot', 'bingbot'];

function classifyVisitor(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const country = request.cf?.country || 'XX';

  for (const pattern of HOSTILE_PATTERNS) {
    if (path.includes(pattern)) {
      return { type: 'HOSTILE', confidence: 0.95, route: 'block', ip, country };
    }
  }

  for (const sig of SCANNER_SIGNATURES) {
    if (ua.includes(sig)) {
      return { type: 'SCANNER', confidence: 0.90, route: 'honeypot', ip, country };
    }
  }

  for (const sig of AI_SIGNATURES) {
    if (ua.includes(sig)) {
      return { type: 'AI_VISITOR', confidence: 0.85, route: 'knowledge', ip, country };
    }
  }

  if (country === 'T1') {
    return { type: 'TOR', confidence: 0.80, route: 'shadow', ip, country };
  }

  return { type: 'COOPERATIVE', confidence: 0.60, route: 'serve', ip, country };
}

function generateCacheKey(request, classification) {
  const url = new URL(request.url);
  const pathHash = hashPath(url.pathname);
  
  return `cache:${classification.type}:${pathHash}:${url.search || 'none'}`;
}

function hashPath(path) {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

describe('Middleware Functions', () => {
  describe('classifyVisitor', () => {
    describe('hostile detection', () => {
      it('should detect .git access as hostile', () => {
        const request = new Request('http://example.com/.git/config', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'HOSTILE');
        assert.strictEqual(result.route, 'block');
      });

      it('should detect .env access as hostile', () => {
        const request = new Request('http://example.com/.env', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'HOSTILE');
      });

      it('should detect wp-admin as hostile', () => {
        const request = new Request('http://example.com/wp-admin/login.php', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'HOSTILE');
      });

      it('should detect xmlrpc as hostile', () => {
        const request = new Request('http://example.com/xmlrpc.php', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'HOSTILE');
      });

      it('should have 0.95 confidence for hostile', () => {
        const request = new Request('http://example.com/.htaccess', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.confidence, 0.95);
      });
    });

    describe('scanner detection', () => {
      it('should detect leakix scanner', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'LeakIX/1.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'SCANNER');
        assert.strictEqual(result.route, 'honeypot');
      });

      it('should detect nuclei scanner', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'nuclei - Open-source security scanner' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'SCANNER');
      });

      it('should detect sqlmap scanner', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'sqlmap/1.6.2' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'SCANNER');
      });

      it('should have 0.90 confidence for scanners', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'nmap scripting engine' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.confidence, 0.90);
      });
    });

    describe('AI visitor detection', () => {
      it('should detect Claude crawler', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'Claude-Web/1.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'AI_VISITOR');
        assert.strictEqual(result.route, 'knowledge');
      });

      it('should detect Anthropic crawler', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'anthropic-ai/1.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'AI_VISITOR');
      });

      it('should detect GPTBot', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'GPTBot/1.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'AI_VISITOR');
      });

      it('should detect Googlebot', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'Googlebot/2.1' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'AI_VISITOR');
      });

      it('should have 0.85 confidence for AI visitors', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'OpenAI-SearchBot/1.0' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.confidence, 0.85);
      });
    });

    describe('Tor detection', () => {
      it('should detect Tor exit nodes', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        // Simulate CF's Tor country code
        request.cf = { country: 'T1' };
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'TOR');
        assert.strictEqual(result.route, 'shadow');
        assert.strictEqual(result.confidence, 0.80);
      });
    });

    describe('cooperative visitors', () => {
      it('should classify normal visitors as cooperative', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'COOPERATIVE');
        assert.strictEqual(result.route, 'serve');
        assert.strictEqual(result.confidence, 0.60);
      });

      it('should handle missing user agent', () => {
        const request = new Request('http://example.com/');
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'COOPERATIVE');
      });
    });

    describe('classification priority', () => {
      it('should prioritize hostile over scanner', () => {
        // Request with both hostile path and scanner UA
        const request = new Request('http://example.com/.git/', {
          headers: { 'user-agent': 'nuclei' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'HOSTILE');
      });

      it('should prioritize scanner over AI', () => {
        const request = new Request('http://example.com/', {
          headers: { 'user-agent': 'nuclei claude' },
        });
        
        const result = classifyVisitor(request);
        assert.strictEqual(result.type, 'SCANNER');
      });
    });
  });

  describe('hashPath', () => {
    it('should produce consistent hash', () => {
      const hash1 = hashPath('/api/test');
      const hash2 = hashPath('/api/test');
      
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different paths', () => {
      const hash1 = hashPath('/api/users');
      const hash2 = hashPath('/api/posts');
      
      assert.notStrictEqual(hash1, hash2);
    });

    it('should return 8 character hex string', () => {
      const hash = hashPath('/test');
      
      assert.strictEqual(hash.length, 8);
      assert.ok(/^[0-9a-f]+$/.test(hash));
    });

    it('should handle empty path', () => {
      const hash = hashPath('');
      assert.strictEqual(hash.length, 8);
    });

    it('should handle long paths', () => {
      const longPath = '/a'.repeat(1000);
      const hash = hashPath(longPath);
      
      assert.strictEqual(hash.length, 8);
    });
  });

  describe('generateCacheKey', () => {
    it('should include classification type', () => {
      const request = new Request('http://example.com/api/test');
      const classification = { type: 'AI_VISITOR' };
      
      const key = generateCacheKey(request, classification);
      assert.ok(key.includes('AI_VISITOR'));
    });

    it('should include path hash', () => {
      const request = new Request('http://example.com/api/test');
      const classification = { type: 'COOPERATIVE' };
      
      const key = generateCacheKey(request, classification);
      const pathHash = hashPath('/api/test');
      
      assert.ok(key.includes(pathHash));
    });

    it('should include query string', () => {
      const request = new Request('http://example.com/api?foo=bar');
      const classification = { type: 'COOPERATIVE' };
      
      const key = generateCacheKey(request, classification);
      assert.ok(key.includes('?foo=bar'));
    });

    it('should use "none" for no query string', () => {
      const request = new Request('http://example.com/api');
      const classification = { type: 'COOPERATIVE' };
      
      const key = generateCacheKey(request, classification);
      assert.ok(key.includes('none'));
    });

    it('should format as cache:TYPE:HASH:QUERY', () => {
      const request = new Request('http://example.com/test');
      const classification = { type: 'SCANNER' };
      
      const key = generateCacheKey(request, classification);
      const parts = key.split(':');
      
      assert.strictEqual(parts[0], 'cache');
      assert.strictEqual(parts[1], 'SCANNER');
      assert.strictEqual(parts[2].length, 8); // hash
    });
  });
});
