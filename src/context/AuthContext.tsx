import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  clearStoredSession,
  getStoredTokens,
  getStoredUserJson,
  registerUnauthorizedHandler,
  setStoredSession,
} from '../api/client';
import { fetchCurrentUser, loginRequest } from '../api/warehouse';
import type { User } from '../types/warehouse';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseCachedUser(): User | null {
  try {
    const raw = getStoredUserJson();
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const { access } = getStoredTokens();
    return access ? parseCachedUser() : null;
  });
  const [loading, setLoading] = useState<boolean>(() => Boolean(getStoredTokens().access));

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const { access } = getStoredTokens();
    if (!access) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchCurrentUser()
      .then((freshUser) => {
        if (!cancelled) {
          setUser(freshUser);
          localStorage.setItem('wms_user_profile', JSON.stringify(freshUser));
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const data = await loginRequest(username.trim(), password);
    setStoredSession(data.access, data.refresh, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
