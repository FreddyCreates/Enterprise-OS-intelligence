/**
 * RSHIP Response Utilities for Cloudflare Workers
 * Medina Tech · RSHIP-2026 · Dallas, TX
 */

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(message, status = 500) {
  return jsonResponse(
    {
      error: true,
      message,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Create a success response with agent data
 */
export function agentResponse(agent, data) {
  return jsonResponse({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      status: agent.status,
    },
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export default {
  jsonResponse,
  errorResponse,
  agentResponse,
  handleCors,
};
