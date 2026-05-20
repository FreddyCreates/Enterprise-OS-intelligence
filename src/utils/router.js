/**
 * RSHIP Request Router for Cloudflare Workers
 * Medina Tech · RSHIP-2026 · Dallas, TX
 */

/**
 * Simple router for Cloudflare Workers
 */
export class Router {
  constructor() {
    this.routes = {
      GET: new Map(),
      POST: new Map(),
      PUT: new Map(),
      DELETE: new Map(),
      OPTIONS: new Map(),
    };
  }

  /**
   * Register a GET route
   */
  get(path, handler) {
    this.routes.GET.set(path, handler);
    return this;
  }

  /**
   * Register a POST route
   */
  post(path, handler) {
    this.routes.POST.set(path, handler);
    return this;
  }

  /**
   * Register a PUT route
   */
  put(path, handler) {
    this.routes.PUT.set(path, handler);
    return this;
  }

  /**
   * Register a DELETE route
   */
  delete(path, handler) {
    this.routes.DELETE.set(path, handler);
    return this;
  }

  /**
   * Register an OPTIONS route (for CORS)
   */
  options(path, handler) {
    this.routes.OPTIONS.set(path, handler);
    return this;
  }

  /**
   * Match a request to a route
   */
  match(method, path) {
    const methodRoutes = this.routes[method];
    if (!methodRoutes) return null;

    // Exact match
    if (methodRoutes.has(path)) {
      return { handler: methodRoutes.get(path), params: {} };
    }

    // Pattern matching with parameters
    for (const [pattern, handler] of methodRoutes) {
      const params = this.matchPattern(pattern, path);
      if (params) {
        return { handler, params };
      }
    }

    return null;
  }

  /**
   * Match URL pattern with parameters
   */
  matchPattern(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  /**
   * Handle incoming request
   */
  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    const match = this.match(method, path);
    if (match) {
      return match.handler(request, env, ctx, match.params);
    }

    return null;
  }
}

export default Router;
