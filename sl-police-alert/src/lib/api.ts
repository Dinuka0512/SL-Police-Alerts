import { getAuthState } from '@/store/auth';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://8.234.94.139:5000';

export const ML_API_BASE_URL: string =
  process.env.EXPO_PUBLIC_ML_API_URL ?? 'http://8.234.94.139:8000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

class HttpClient {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { token } = getAuthState();

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new ApiError(0, 'Unable to reach the backend server');
    }

    if (res.status === 204) {
      return undefined as T;
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

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>(`${path}${buildQuery(query)}`);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const http = new HttpClient();
