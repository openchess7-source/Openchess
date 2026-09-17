import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../../services/authService';
import { currentUser as mockCurrentUser } from '../../mocks/players';
import { DEMO_MODE } from '../../config/env';

const AuthContext = createContext(null);

// DEMO_MODE (see src/config/env.js) lets this codebase be previewed
// without a live Openchess backend attached. It now defaults to OFF —
// set VITE_DEMO_MODE=true explicitly for local/sandboxed preview.

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (DEMO_MODE) {
        // Skip the network round-trip; simulate the same async shape.
        await new Promise((r) => setTimeout(r, 250));
        if (cancelled) return;
        setUser(mockCurrentUser);
        setStatus('authenticated');
        return;
      }
      try {
        const me = await authService.me();
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setStatus('guest');
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials) {
    if (DEMO_MODE) {
      setUser(mockCurrentUser);
      setStatus('authenticated');
      return mockCurrentUser;
    }
    const me = await authService.login(credentials);
    setUser(me);
    setStatus('authenticated');
    return me;
  }

  async function register(payload) {
    if (DEMO_MODE) {
      setUser(mockCurrentUser);
      setStatus('authenticated');
      return mockCurrentUser;
    }
    const me = await authService.register(payload);
    setUser(me);
    setStatus('authenticated');
    return me;
  }

  async function logout() {
    if (!DEMO_MODE) {
      try {
        await authService.logout();
      } catch {
        // proceed to clear client state regardless
      }
    }
    setUser(null);
    setStatus('guest');
  }

  const value = useMemo(
    () => ({ status, user, isAuthenticated: status === 'authenticated', login, register, logout }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
