/**
 * AuthContext — provides authentication state to the entire app.
 *
 * On mount, it checks for a stored JWT and calls /auth/me to validate it.
 * If the token is expired or missing the user starts as null (not logged in).
 *
 * All child components get access to: user, loading, signIn, signOut, signUp, setUser.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '@/services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on boot ──────────────────────────────────────────────
  // If there is a JWT in localStorage, verify it against the server.
  // If the server rejects it (expired, tampered), we clear the user silently.
  useEffect(() => {
    authService.getCurrentUser()
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (identifier, password) => {
    const res = await authService.signIn(identifier, password);

    if (res.success) {
      // After saving the token, fetch the full profile so we have all fields
      const profile = await authService.getCurrentUser();
      if (profile.success && profile.data) {
        setUser(profile.data);
      }
    }

    return res;
  }, []);

  // ── Sign up (company registration) ───────────────────────────────────────
  const signUp = useCallback(async (payload) => {
    const res = await authService.signUpCompany(payload);

    if (res.success) {
      const profile = await authService.getCurrentUser();
      if (profile.success && profile.data) {
        setUser(profile.data);
      }
    }

    return res;
  }, []);

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    authService.signOut();   // clears localStorage token
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    setUser,    // exposed so profile edits (e.g. password change) can update state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside an AuthProvider');
  return ctx;
}
