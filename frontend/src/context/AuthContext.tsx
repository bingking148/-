import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { APIService, type AuthResponse, type AuthUser } from '../services/api';
import {
  clearStoredAuthState,
  loadStoredAuthState,
  saveStoredAuthState,
} from '../services/authStorage';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applyAuthPayload(setUser: (user: AuthUser | null) => void, setToken: (token: string | null) => void, payload: AuthResponse) {
  saveStoredAuthState(payload);
  setUser(payload.user);
  setToken(payload.token);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const storedAuth = loadStoredAuthState<AuthUser>();
  const [user, setUser] = useState<AuthUser | null>(storedAuth?.user || null);
  const [token, setToken] = useState<string | null>(storedAuth?.token || null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(storedAuth?.token));

  useEffect(() => {
    if (!storedAuth?.token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    APIService.getCurrentUser()
      .then((nextUser) => {
        if (cancelled) {
          return;
        }
        setUser(nextUser);
        saveStoredAuthState({ token: storedAuth.token, user: nextUser });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        clearStoredAuthState();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storedAuth?.token]);

  const login = async (username: string, password: string) => {
    const payload = await APIService.login(username, password);
    applyAuthPayload(setUser, setToken, payload);
  };

  const register = async (username: string, password: string) => {
    const payload = await APIService.register(username, password);
    applyAuthPayload(setUser, setToken, payload);
  };

  const logout = async () => {
    try {
      await APIService.logout();
    } catch {
      // Best-effort logout; local state is cleared either way.
    } finally {
      clearStoredAuthState();
      setUser(null);
      setToken(null);
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
