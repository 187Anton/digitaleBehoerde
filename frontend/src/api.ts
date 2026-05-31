const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

type AuthUser = {
  id: string;
  email: string;
  role: "CITIZEN" | "CASEWORKER";
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
};

type AuthPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Anfrage fehlgeschlagen.");
  }

  return response.json() as Promise<T>;
}

export function login(payload: AuthPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: AuthPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/me");
}

export function logout(): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}
