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
export type Service = {
  type: "RESIDENCE_CHANGE" | "DOG_TAX" | "CERTIFICATE_OF_CONDUCT";
  title: string;
  description: string;
  available: boolean;
};
export type ServicesResponse = {
  services: Service[];
};
export type ResidenceChangeInput = {
  moveDate: string;
  oldStreet: string;
  oldPostalCode: string;
  oldCity: string;
  newStreet: string;
  newPostalCode: string;
  newCity: string;
  householdSize: number;
};
export type ApplicationStatus = "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type Application = {
  id: string;
  type: "RESIDENCE_CHANGE";
  status: ApplicationStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  residenceChange: (ResidenceChangeInput & { id: string; applicationId: string }) | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
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
export function fetchServices(): Promise<ServicesResponse> {
  return request<ServicesResponse>("/api/services");
}
export function fetchApplications(): Promise<{ applications: Application[] }> {
  return request<{ applications: Application[] }>("/api/applications");
}
export function createResidenceChange(
  payload: ResidenceChangeInput
): Promise<{ application: Application }> {
  return request<{ application: Application }>("/api/applications/residence-change", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function fetchCaseworkerApplications(): Promise<{ applications: Application[] }> {
  return request<{ applications: Application[] }>("/api/caseworker/applications");
}
export function updateApplicationStatus(
  applicationId: string,
  status: Exclude<ApplicationStatus, "SUBMITTED">
): Promise<{ application: Application }> {
  return request<{ application: Application }>(
    `/api/caseworker/applications/${encodeURIComponent(applicationId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}
