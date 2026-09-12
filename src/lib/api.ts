const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('nexus_auth_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  let body = options.body;
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    body,
    headers
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorData: any = {};
    if (contentType.includes('application/json')) {
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
    } else {
      const text = await response.text();
      errorData = { error: text || response.statusText || `Request failed with status ${response.status}` };
    }
    throw new ApiError(errorData.error || `Request failed with status ${response.status}`, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(`Expected JSON response but received ${contentType || 'plain text'}: ${text.slice(0, 100)}`, response.status);
  }
}
