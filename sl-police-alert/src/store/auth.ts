import { useSyncExternalStore } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  police_id: string;
  department: string;
  email: string;
  contact: string;
  role: string;
  status: string;
};

export type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const INITIAL_STATE: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
};

let state: AuthState = INITIAL_STATE;
const listeners = new Set<() => void>();

function getSnapshot(): AuthState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setState(next: AuthState): void {
  state = next;
  listeners.forEach(listener => listener());
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getAuthState(): AuthState {
  return state;
}

export function setAuth(
  token: string,
  refreshToken: string,
  user: AuthUser
): void {
  setState({ token, refreshToken, user });
}

export function clearAuth(): void {
  setState(INITIAL_STATE);
}