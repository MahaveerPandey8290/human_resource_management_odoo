/**
 * Central API client for Dayflow HRMS.
 *
 * Every service file imports `apiFetch` from here.
 * To switch environments, change VITE_API_URL in your .env file.
 *
 * Token is read from localStorage on every request so it picks
 * up fresh values after login without a page reload.
 */

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ──────────────────────────────────────────────────────────────

export function getToken() {
  try {
    return localStorage.getItem('dayflow_token') || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('dayflow_token', token);
    else localStorage.removeItem('dayflow_token');
  } catch { /* storage blocked */ }
}

// ── Response envelope helpers ─────────────────────────────────────────────────
// These match the shape the backend already returns:
//   { success: true,  data: ..., meta: { page, limit, total } }
//   { success: false, error: { code, message } }

export function ok(data, meta) {
  return { success: true, data, meta: meta ?? null };
}

export function fail(code, message) {
  return { success: false, error: { code, message } };
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * Makes an authenticated request to the backend.
 *
 * @param {string} path        - e.g. '/auth/login'
 * @param {RequestInit} [opts] - standard fetch options (method, body, etc.)
 * @returns {Promise<{ success: boolean, data?: any, meta?: any, error?: { code, message } }>}
 */
export async function apiFetch(path, opts = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  // Remove Content-Type for FormData so browser sets boundary automatically
  if (opts.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers,
    });

    // Parse JSON regardless of status code (backend always returns JSON)
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.ok && payload?.success) {
      return payload;
    }

    // Standardise error shape
    const errorMessage =
      payload?.error?.message ||
      payload?.message ||
      `Server error (${response.status})`;

    const errorCode =
      payload?.error?.code || `HTTP_${response.status}`;

    return fail(errorCode, errorMessage);

  } catch (networkError) {
    // Covers cases like the server being offline
    return fail(
      'NETWORK_ERROR',
      'Could not reach the server. Please check that the backend is running.'
    );
  }
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const api = {
  get: (path) =>
    apiFetch(path, { method: 'GET' }),

  post: (path, body) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: (path, body) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),

  put: (path, body) =>
    apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (path) =>
    apiFetch(path, { method: 'DELETE' }),

  upload: (path, formData) =>
    apiFetch(path, { method: 'POST', body: formData }),
};
