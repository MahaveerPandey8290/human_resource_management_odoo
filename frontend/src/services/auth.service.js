/**
 * Auth service — sign in, sign out, profile fetch, password change.
 *
 * All functions return the standard envelope:
 *   { success: true,  data: ... }
 *   { success: false, error: { code, message } }
 *
 * The JWT token is stored in localStorage by `setToken` so every
 * subsequent apiFetch automatically includes it.
 */

import { api, setToken, getToken } from '@/lib/api';

// ── Sign in ───────────────────────────────────────────────────────────────────

/**
 * Authenticates a user and saves the returned JWT.
 * Works with both a Login ID (OIJODO20220001) or a work email.
 *
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<{ success: boolean, data?: { token: string, user: object } }>}
 */
export async function signIn(identifier, password) {
  const res = await api.post('/auth/login', { identifier, password });

  if (res.success && res.data?.token) {
    // Save the JWT — apiFetch will pick it up from here on
    setToken(res.data.token);
  }

  return res;
}

// ── Sign out ──────────────────────────────────────────────────────────────────

/**
 * Clears the local JWT and session state.
 * The backend is stateless (JWT), so no API call needed.
 */
export function signOut() {
  setToken(null);
  return Promise.resolve({ success: true, data: { signedOut: true } });
}

// ── Current user ──────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated employee's full profile.
 * Called on app boot to restore the session from the stored token.
 *
 * @returns {Promise<{ success: boolean, data?: object }>}
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return { success: false, error: { code: 'NO_TOKEN', message: 'Not signed in.' } };
  return api.get('/auth/me');
}

// ── Change password ───────────────────────────────────────────────────────────

/**
 * Changes the authenticated user's password.
 * On the first login, the user must use this before accessing any protected route.
 *
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean }>}
 */
export async function changePassword(currentPassword, newPassword) {
  return api.post('/auth/change-password', { currentPassword, newPassword });
}

// ── Company registration ──────────────────────────────────────────────────────

/**
 * Registers a new company and creates the first admin account.
 * Saves the JWT returned by the backend so the user is immediately signed in.
 *
 * @param {{ companyName: string, name?: string, firstName?: string, lastName?: string, email: string, phone: string, password: string, logoUrl?: string }} payload
 */
export async function signUpCompany(payload) {
  const rawName = (payload.name || '').trim();
  const nameParts = rawName ? rawName.split(/\s+/) : [];
  const firstName = payload.firstName || nameParts[0] || 'Admin';
  const lastName = payload.lastName || nameParts.slice(1).join(' ') || 'User';

  const body = {
    companyName: payload.companyName?.trim(),
    companyPhone: payload.phone?.trim() || undefined,
    logoUrl: payload.logoUrl || undefined,
    adminFirstName: firstName,
    adminLastName: lastName,
    adminEmail: (payload.email || payload.adminEmail)?.trim(),
    adminPassword: payload.password || payload.adminPassword,
  };

  const res = await api.post('/auth/register-company', body);

  if (res.success && res.data?.token) {
    setToken(res.data.token);
  }

  return res;
}
