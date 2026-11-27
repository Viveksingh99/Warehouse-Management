const STORAGE_ACCESS_KEY = 'wms_access_token';
const STORAGE_REFRESH_KEY = 'wms_refresh_token';
const STORAGE_USER_KEY = 'wms_user_profile';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/+$/,
  '',
);

export class ApiError extends Error {
  status: number;
  field?: string;
  payload?: unknown;

  constructor(message: string, status: number, field?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
    this.payload = payload;
  }
}

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem(STORAGE_ACCESS_KEY),
    refresh: localStorage.getItem(STORAGE_REFRESH_KEY),
  };
}

export function setStoredSession(access: string, refresh: string, userJson?: string): void {
  localStorage.setItem(STORAGE_ACCESS_KEY, access);
  localStorage.setItem(STORAGE_REFRESH_KEY, refresh);
  if (userJson) {
    localStorage.setItem(STORAGE_USER_KEY, userJson);
  }
}

export function getStoredUserJson(): string | null {
  return localStorage.getItem(STORAGE_USER_KEY);
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_ACCESS_KEY);
  localStorage.removeItem(STORAGE_REFRESH_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

function extractErrorMessage(data: unknown, fallback: string): { message: string; field?: string } {
  if (!data || typeof data !== 'object') {
    return { message: fallback };
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === 'string') {
    return {
      message: obj.detail,
      field: typeof obj.field === 'string' ? obj.field : undefined,
    };
  }
  if (Array.isArray(obj.non_field_errors) && typeof obj.non_field_errors[0] === 'string') {
    return { message: obj.non_field_errors[0] };
  }
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return { message: `${key}: ${value[0]}`, field: key };
    }
    if (typeof value === 'string') {
      return { message: value, field: key };
    }
  }
  return { message: fallback };
}

let refreshInFlight: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(cb: () => void): void {
  onUnauthorizedCallback = cb;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  const { refresh } = getStoredTokens();
  if (!refresh) {
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { access: string; refresh?: string };
      localStorage.setItem(STORAGE_ACCESS_KEY, data.access);
      if (data.refresh) {
        localStorage.setItem(STORAGE_REFRESH_KEY, data.refresh);
      }
      return data.access;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;
  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const { access } = getStoredTokens();
    if (access) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
      });
    }
    if (response.status === 401) {
      clearStoredSession();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const { message, field } = extractErrorMessage(
      data,
      `Request failed with status ${response.status}`,
    );
    throw new ApiError(message, response.status, field, data);
  }

  return data as T;
}
