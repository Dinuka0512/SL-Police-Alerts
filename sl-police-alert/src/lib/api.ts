import Constants from 'expo-constants';

import { getAuthState } from '@/store/auth';

function resolveHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Fallbacks for older Expo dev-client shapes.
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost ??
    null;

  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  return host || null;
}

export const API_BASE_URL: string = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const host = resolveHost();
  // On a physical device "localhost" points at the phone itself, so use the
  // Metro dev-server host (the machine running the backend). Android emulators
  // reach the host machine via 10.0.2.2.
  return host ? `http://${host}:5000` : 'http://10.0.2.2:5000';
})();

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthState().token
          ? { Authorization: `Bearer ${getAuthState().token}` }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the backend server');
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'success' in body &&
    'data' in body
  ) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export const api = {
  login(email: string, password: string): Promise<{
    token: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      name: string;
      police_id: string;
      department: string;
      email: string;
      contact: string;
      role: string;
      status: string;
    };
  }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMessages(): Promise<RawMessage[]> {
    return request('/api/messages');
  },
};

export type RawMessage = {
  m_id: string;
  image: string;
  title: string;
  content: string;
  date: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  sentBy: string;
  departments: { departmentId: string; status: string }[];
};