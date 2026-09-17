export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

const AUTH_PATHS = ["/api/auth/login", "/api/auth/refresh"];

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some(p => path.startsWith(p));
}

function buildQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export class HttpClient {
  private tokenProvider: (() => string | null) | null = null;
  private onRefresh: (() => Promise<string | null>) | null = null;

  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  setTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  setRefreshHandler(handler: () => Promise<string | null>): void {
    this.onRefresh = handler;
  }

  private async doFetch(
    path: string,
    init: RequestInit,
    token: string | null
  ): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new ApiError(0, "Unable to reach the backend server");
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.tokenProvider?.() ?? null;

    let res = await this.doFetch(path, init, token);

    if (
      res.status === 401 &&
      token &&
      !isAuthPath(path) &&
      this.onRefresh
    ) {
      const newToken = await this.onRefresh();
      if (newToken) {
        res = await this.doFetch(path, init, newToken);
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        (body as { message?: string }).message ?? `Request failed with status ${res.status}`
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const data: unknown = await res.json().catch(() => null);

    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "success" in data &&
      "data" in data
    ) {
      return (data as { data: T }).data;
    }

    return data as T;
  }

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>(`${path}${buildQuery(query)}`);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const http = new HttpClient();