/**
 * Router Tests
 * Tests for src/utils/router.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Router } from '../src/utils/router.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    router = new Router();
  });

  describe('constructor', () => {
    it('should initialize with empty route maps for all HTTP methods', () => {
      assert.ok(router.routes.GET instanceof Map);
      assert.ok(router.routes.POST instanceof Map);
      assert.ok(router.routes.PUT instanceof Map);
      assert.ok(router.routes.DELETE instanceof Map);
      assert.ok(router.routes.OPTIONS instanceof Map);
      assert.strictEqual(router.routes.GET.size, 0);
    });
  });

  describe('route registration', () => {
    it('should register GET routes', () => {
      const handler = () => {};
      router.get('/test', handler);
      assert.strictEqual(router.routes.GET.get('/test'), handler);
    });

    it('should register POST routes', () => {
      const handler = () => {};
      router.post('/test', handler);
      assert.strictEqual(router.routes.POST.get('/test'), handler);
    });

    it('should register PUT routes', () => {
      const handler = () => {};
      router.put('/test', handler);
      assert.strictEqual(router.routes.PUT.get('/test'), handler);
    });

    it('should register DELETE routes', () => {
      const handler = () => {};
      router.delete('/test', handler);
      assert.strictEqual(router.routes.DELETE.get('/test'), handler);
    });

    it('should register OPTIONS routes', () => {
      const handler = () => {};
      router.options('/test', handler);
      assert.strictEqual(router.routes.OPTIONS.get('/test'), handler);
    });

    it('should be chainable', () => {
      const result = router
        .get('/one', () => {})
        .post('/two', () => {})
        .put('/three', () => {});
      assert.strictEqual(result, router);
    });
  });

  describe('match', () => {
    it('should match exact routes', () => {
      const handler = () => 'test';
      router.get('/test', handler);
      
      const result = router.match('GET', '/test');
      assert.strictEqual(result.handler, handler);
      assert.deepStrictEqual(result.params, {});
    });

    it('should return null for unmatched routes', () => {
      const result = router.match('GET', '/nonexistent');
      assert.strictEqual(result, null);
    });

    it('should return null for invalid HTTP methods', () => {
      const result = router.match('INVALID', '/test');
      assert.strictEqual(result, null);
    });

    it('should match routes with parameters', () => {
      const handler = () => {};
      router.get('/users/:id', handler);
      
      const result = router.match('GET', '/users/123');
      assert.strictEqual(result.handler, handler);
      assert.deepStrictEqual(result.params, { id: '123' });
    });

    it('should match routes with multiple parameters', () => {
      const handler = () => {};
      router.get('/users/:userId/posts/:postId', handler);
      
      const result = router.match('GET', '/users/42/posts/99');
      assert.deepStrictEqual(result.params, { userId: '42', postId: '99' });
    });

    it('should prefer exact match over pattern match', () => {
      const exactHandler = () => 'exact';
      const patternHandler = () => 'pattern';
      router.get('/users/admin', exactHandler);
      router.get('/users/:id', patternHandler);
      
      const result = router.match('GET', '/users/admin');
      assert.strictEqual(result.handler, exactHandler);
    });
  });

  describe('matchPattern', () => {
    it('should return null for different segment counts', () => {
      const result = router.matchPattern('/a/b/c', '/a/b');
      assert.strictEqual(result, null);
    });

    it('should return null for non-matching static segments', () => {
      const result = router.matchPattern('/api/users', '/api/posts');
      assert.strictEqual(result, null);
    });

    it('should extract single parameter', () => {
      const result = router.matchPattern('/users/:id', '/users/123');
      assert.deepStrictEqual(result, { id: '123' });
    });

    it('should extract multiple parameters', () => {
      const result = router.matchPattern('/:org/:repo/:branch', '/github/repo/main');
      assert.deepStrictEqual(result, { org: 'github', repo: 'repo', branch: 'main' });
    });

    it('should match routes with mixed static and dynamic segments', () => {
      const result = router.matchPattern('/api/:version/users/:id', '/api/v1/users/42');
      assert.deepStrictEqual(result, { version: 'v1', id: '42' });
    });
  });

  describe('handle', () => {
    it('should handle matched requests', async () => {
      const handler = async () => new Response('success');
      router.get('/test', handler);
      
      const request = new Request('http://localhost/test');
      const result = await router.handle(request, {}, {});
      
      assert.ok(result instanceof Response);
    });

    it('should return null for unmatched requests', async () => {
      const request = new Request('http://localhost/unknown');
      const result = await router.handle(request, {}, {});
      
      assert.strictEqual(result, null);
    });

    it('should pass params to handler', async () => {
      let receivedParams;
      const handler = async (req, env, ctx, params) => {
        receivedParams = params;
        return new Response('ok');
      };
      router.get('/users/:id', handler);
      
      const request = new Request('http://localhost/users/456');
      await router.handle(request, {}, {});
      
      assert.deepStrictEqual(receivedParams, { id: '456' });
    });

    it('should pass env and ctx to handler', async () => {
      let receivedEnv, receivedCtx;
      const handler = async (req, env, ctx) => {
        receivedEnv = env;
        receivedCtx = ctx;
        return new Response('ok');
      };
      router.get('/test', handler);
      
      const mockEnv = { TEST: 'value' };
      const mockCtx = { waitUntil: () => {} };
      const request = new Request('http://localhost/test');
      
      await router.handle(request, mockEnv, mockCtx);
      
      assert.strictEqual(receivedEnv, mockEnv);
      assert.strictEqual(receivedCtx, mockCtx);
    });
  });
});
