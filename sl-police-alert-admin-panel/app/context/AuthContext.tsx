import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { authService } from "~/services";
import { authUserFromDTO } from "~/dto/mappers";
import { http } from "~/lib/http";

import type { AuthUser } from "~/types";

const STORAGE_KEY = "sl_police_admin_session";

interface StoredSession {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredSession;
  } catch {
    // ignore corrupted session
  }
  return null;
}

function writeSession(session: StoredSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable — session stays in memory
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextType["status"]>("loading");
  const sessionRef = useRef<StoredSession | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session) {
      sessionRef.current = session;
      setUser(session.user);
      setToken(session.token);
      setStatus("authenticated");
      return;
    }
    setStatus("unauthenticated");
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current?.refreshToken) return null;

    try {
      const res = await authService.refresh(current.refreshToken);
      const next: StoredSession = {
        token: res.token,
        refreshToken: res.refreshToken,
        user: current.user,
      };
      sessionRef.current = next;
      writeSession(next);
      setToken(next.token);
      return next.token;
    } catch {
      const stored = sessionRef.current;
      if (stored?.refreshToken) {
        authService.logout(stored.refreshToken).catch(() => {
          // best-effort server-side revoke
        });
      }
      sessionRef.current = null;
      clearSession();
      setUser(null);
      setToken(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  const handleRefresh = useCallback((): Promise<string | null> => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = doRefresh().finally(() => {
        refreshPromiseRef.current = null;
      });
    }
    return refreshPromiseRef.current;
  }, [doRefresh]);

  useEffect(() => {
    http.setTokenProvider(() => sessionRef.current?.token ?? null);
    http.setRefreshHandler(handleRefresh);
  }, [handleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    const authedUser = authUserFromDTO(res.user);
    const session: StoredSession = {
      token: res.token,
      refreshToken: res.refreshToken,
      user: authedUser,
    };
    sessionRef.current = session;
    writeSession(session);
    setUser(authedUser);
    setToken(res.token);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    const stored = sessionRef.current;
    if (stored?.refreshToken) {
      authService.logout(stored.refreshToken).catch(() => {
        // best-effort server-side revoke
      });
    }
    sessionRef.current = null;
    clearSession();
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}