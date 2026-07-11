const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type AuthUser = {
  id: string;
  email: string;
  role: "CITIZEN" | "CASEWORKER";
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
};

export type ProfileUpdateInput = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  street?: string;
  postalCode?: string;
  city?: string;
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
export type ResidenceChangeDocuments = {
  identityDocument: File;
  landlordConfirmation: File;
  moveInConfirmation?: File;
};
export type DogTaxInput = {
  dogName: string;
  dogBreed?: string;
  dogBirthDate?: string;
  chipNumber?: string;
  ownerStreet: string;
  ownerPostalCode: string;
  ownerCity: string;
  taxStartDate: string;
};
export type CertificateOfConductInput = {
  purpose: string;
  deliveryType: "PRIVATE" | "AUTHORITY";
  deliveryRecipient: string;
  deliveryStreet: string;
  deliveryPostalCode: string;
  deliveryCity: string;
};
export type ApplicationStatus = "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type ApplicationDocument = {
  id: string;
  applicationId: string;
  originalName: string;
  mimeType: string;
  type: "OTHER" | "IDENTITY_DOCUMENT" | "LANDLORD_CONFIRMATION" | "MOVE_IN_CONFIRMATION";
  size: number;
  uploadedAt: string;
};
export type ChatMessage = {
export type ApplicationComment = {
  id: string;
  applicationId: string;
  authorId: string;
  body: string;
  createdAt: string;
  readByCitizenAt: string | null;
  readByCaseworkerAt: string | null;
  author: {
    id: string;
    role: "CITIZEN" | "CASEWORKER";
    firstName: string | null;
    lastName: string | null;
  };
};
export type Application = {
  id: string;
  type: "RESIDENCE_CHANGE" | "DOG_TAX" | "CERTIFICATE_OF_CONDUCT";
  status: ApplicationStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  residenceChange: (ResidenceChangeInput & { id: string; applicationId: string }) | null;
  dogTax: (DogTaxInput & { id: string; applicationId: string }) | null;
  certificateOfConduct:
    | (CertificateOfConductInput & { id: string; applicationId: string })
    | null;
  documents: ApplicationDocument[];
  unreadChatMessages?: number;
  comments?: ApplicationComment[];
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
  payload: ResidenceChangeInput,
  documents: ResidenceChangeDocuments
): Promise<{ application: Application }> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  formData.append("identityDocument", documents.identityDocument);
  formData.append("landlordConfirmation", documents.landlordConfirmation);
  if (documents.moveInConfirmation) {
    formData.append("moveInConfirmation", documents.moveInConfirmation);
  }
  return fetch(`${API_BASE_URL}/api/applications/residence-change`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Wohnsitzummeldung konnte nicht eingereicht werden.");
    }
    return response.json() as Promise<{ application: Application }>;
  });
}
export function createDogTax(
  payload: DogTaxInput
): Promise<{ application: Application }> {
  return request<{ application: Application }>("/api/applications/dog-tax", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function createCertificateOfConduct(
  payload: CertificateOfConductInput
): Promise<{ application: Application }> {
  return request<{ application: Application }>("/api/applications/certificate-of-conduct", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function updateApplication(
  applicationId: string,
  payload: ResidenceChangeInput | DogTaxInput | CertificateOfConductInput
): Promise<{ application: Application }> {
  return request<{ application: Application }>(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}
export async function uploadApplicationDocument(
  applicationId: string,
  file: File
): Promise<{ document: ApplicationDocument }> {
  const formData = new FormData();
  formData.append("document", file);
  const response = await fetch(
    `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/documents`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Dokument konnte nicht hochgeladen werden.");
  }
  return response.json() as Promise<{ document: ApplicationDocument }>;
}
export async function replaceApplicationDocument(
  applicationId: string,
  documentId: string,
  file: File
): Promise<{ document: ApplicationDocument }> {
  const formData = new FormData();
  formData.append("document", file);
  const response = await fetch(
    `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      credentials: "include",
      body: formData,
    }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Dokument konnte nicht ersetzt werden.");
  }
  return response.json() as Promise<{ document: ApplicationDocument }>;
}
export async function deleteApplicationDocument(
  applicationId: string,
  documentId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Dokument konnte nicht gelöscht werden.");
  }
}
export function applicationDocumentUrl(applicationId: string, documentId: string): string {
  return `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`;
}
export function applicationDocumentPreviewUrl(applicationId: string, documentId: string): string {
  return `${applicationDocumentUrl(applicationId, documentId)}?inline=true`;
}
export function updateProfile(payload: ProfileUpdateInput): Promise<AuthResponse> {
  return request<AuthResponse>("/api/profile", {
    method: "PATCH",
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
export function fetchApplicationChat(
  applicationId: string,
  role: AuthUser["role"]
): Promise<{ messages: ChatMessage[] }> {
  const path = role === "CASEWORKER"
    ? `/api/caseworker/applications/${encodeURIComponent(applicationId)}/messages`
    : `/api/applications/${encodeURIComponent(applicationId)}/messages`;
  return request<{ messages: ChatMessage[] }>(path);
}
export function sendApplicationChatMessage(
  applicationId: string,
  role: AuthUser["role"],
  body: string
): Promise<{ message: ChatMessage }> {
  const path = role === "CASEWORKER"
    ? `/api/caseworker/applications/${encodeURIComponent(applicationId)}/messages`
    : `/api/applications/${encodeURIComponent(applicationId)}/messages`;
  return request<{ message: ChatMessage }>(path, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
export function addApplicationComment(
  applicationId: string,
  body: string
): Promise<{ comment: ApplicationComment }> {
  return request<{ comment: ApplicationComment }>(
    `/api/caseworker/applications/${encodeURIComponent(applicationId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    }
  );
}
