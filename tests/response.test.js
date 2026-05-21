/**
 * Response Utilities Tests
 * Tests for src/utils/response.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { jsonResponse, errorResponse, agentResponse, handleCors } from '../src/utils/response.js';

describe('Response Utilities', () => {
  describe('jsonResponse', () => {
    it('should create a Response with JSON content type', async () => {
      const data = { test: 'value' };
      const response = jsonResponse(data);
      
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
    });

    it('should serialize data to JSON', async () => {
      const data = { foo: 'bar', num: 42 };
      const response = jsonResponse(data);
      
      const body = await response.json();
      assert.deepStrictEqual(body, data);
    });

    it('should default to status 200', () => {
      const response = jsonResponse({});
      assert.strictEqual(response.status, 200);
    });

    it('should use custom status code', () => {
      const response = jsonResponse({}, 201);
      assert.strictEqual(response.status, 201);
    });

    it('should include CORS headers', () => {
      const response = jsonResponse({});
      
      assert.strictEqual(response.headers.get('Access-Control-Allow-Origin'), '*');
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('GET'));
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('POST'));
      assert.ok(response.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));
    });

    it('should handle complex nested objects', async () => {
      const data = {
        nested: { deeply: { value: [1, 2, 3] } },
        array: [{ item: 1 }, { item: 2 }],
      };
      const response = jsonResponse(data);
      
      const body = await response.json();
      assert.deepStrictEqual(body, data);
    });

    it('should handle null and undefined values', async () => {
      const data = { nullVal: null, exists: true };
      const response = jsonResponse(data);
      
      const body = await response.json();
      assert.strictEqual(body.nullVal, null);
      assert.strictEqual(body.exists, true);
    });
  });

  describe('errorResponse', () => {
    it('should create error response with message', async () => {
      const response = errorResponse('Something went wrong');
      const body = await response.json();
      
      assert.strictEqual(body.error, true);
      assert.strictEqual(body.message, 'Something went wrong');
    });

    it('should default to status 500', () => {
      const response = errorResponse('Error');
      assert.strictEqual(response.status, 500);
    });

    it('should use custom status code', () => {
      const response = errorResponse('Not Found', 404);
      assert.strictEqual(response.status, 404);
    });

    it('should include timestamp', async () => {
      const before = new Date().toISOString();
      const response = errorResponse('Error');
      const body = await response.json();
      const after = new Date().toISOString();
      
      assert.ok(body.timestamp >= before);
      assert.ok(body.timestamp <= after);
    });

    it('should include CORS headers', () => {
      const response = errorResponse('Error');
      assert.strictEqual(response.headers.get('Access-Control-Allow-Origin'), '*');
    });
  });

  describe('agentResponse', () => {
    it('should include agent info in response', async () => {
      const agent = { id: 'AGENT-001', name: 'TestAgent', status: 'ACTIVE' };
      const data = { result: 'success' };
      
      const response = agentResponse(agent, data);
      const body = await response.json();
      
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.agent, agent);
      assert.deepStrictEqual(body.data, data);
    });

    it('should include timestamp', async () => {
      const agent = { id: 'A1', name: 'Agent', status: 'ACTIVE' };
      const response = agentResponse(agent, {});
      const body = await response.json();
      
      assert.ok(body.timestamp);
      assert.ok(new Date(body.timestamp).getTime() > 0);
    });

    it('should handle empty data', async () => {
      const agent = { id: 'A1', name: 'Agent', status: 'ACTIVE' };
      const response = agentResponse(agent, {});
      const body = await response.json();
      
      assert.deepStrictEqual(body.data, {});
    });

    it('should handle complex agent data', async () => {
      const agent = { 
        id: 'RSHIP-2026-AXIOM-001', 
        name: 'AXIOM', 
        status: 'ACTIVE',
      };
      const data = { 
        knowledge_count: 100, 
        vault_count: 50,
        nested: { value: true },
      };
      
      const response = agentResponse(agent, data);
      const body = await response.json();
      
      assert.strictEqual(body.agent.id, 'RSHIP-2026-AXIOM-001');
      assert.strictEqual(body.data.knowledge_count, 100);
    });
  });

  describe('handleCors', () => {
    it('should return 204 No Content', () => {
      const response = handleCors();
      assert.strictEqual(response.status, 204);
    });

    it('should include all CORS headers', () => {
      const response = handleCors();
      
      assert.strictEqual(response.headers.get('Access-Control-Allow-Origin'), '*');
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('GET'));
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('POST'));
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('PUT'));
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('DELETE'));
      assert.ok(response.headers.get('Access-Control-Allow-Methods').includes('OPTIONS'));
      assert.ok(response.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));
      assert.ok(response.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
    });

    it('should include max-age header', () => {
      const response = handleCors();
      assert.strictEqual(response.headers.get('Access-Control-Max-Age'), '86400');
    });

    it('should have null body', async () => {
      const response = handleCors();
      const text = await response.text();
      assert.strictEqual(text, '');
    });
  });
});
