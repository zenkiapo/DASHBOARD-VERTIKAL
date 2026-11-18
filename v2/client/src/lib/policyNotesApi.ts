import type {
  AuthSession,
  NoteStatus,
  PolicyNoteContent,
  PolicyNoteDTO,
  PolicyNoteFollowUp,
  UserRole,
} from "../types/policyNotes";
import { apiUrl } from "./apiBase";

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Permintaan gagal (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  return request<AuthSession>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function loginAsDemo(role: UserRole): Promise<AuthSession> {
  return request<AuthSession>("/api/auth/demo-login", {
    method: "POST",
    body: { role },
  });
}

export async function fetchCurrentSession(): Promise<AuthSession | null> {
  const response = await fetch(apiUrl("/api/auth/me"), {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (response.status === 401) return null;
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Permintaan gagal (${response.status}).`;
    throw new Error(message);
  }
  return payload as AuthSession;
}

export async function logoutCurrentSession(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

export async function fetchPolicyNotes(): Promise<PolicyNoteDTO[]> {
  const result =
    await request<{ notes: PolicyNoteDTO[] }>("/api/policy-notes");
  return result.notes;
}

export async function createPolicyNote(
  content: PolicyNoteContent,
): Promise<PolicyNoteDTO> {
  const result = await request<{ note: PolicyNoteDTO }>("/api/policy-notes", {
    method: "POST",
    body: content,
  });
  return result.note;
}

export async function updatePolicyContent(
  id: string,
  content: PolicyNoteContent,
): Promise<PolicyNoteDTO> {
  const result = await request<{ note: PolicyNoteDTO }>(
    `/api/policy-notes/${encodeURIComponent(id)}`,
    { method: "PATCH", body: content },
  );
  return result.note;
}

export async function updatePolicyFollowUp(
  id: string,
  followUp: PolicyNoteFollowUp,
): Promise<PolicyNoteDTO> {
  const result = await request<{ note: PolicyNoteDTO }>(
    `/api/policy-notes/${encodeURIComponent(id)}`,
    { method: "PATCH", body: followUp },
  );
  return result.note;
}

export async function deletePolicyNote(id: string): Promise<void> {
  await request<void>(`/api/policy-notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const NOTE_STATUS_LABELS: Record<NoteStatus, string> = {
  PENDING: "Menunggu",
  IN_PROGRESS: "Dalam proses",
  COMPLETED: "Selesai",
};
