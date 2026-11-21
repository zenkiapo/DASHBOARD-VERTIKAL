import type {
  AnnouncementDTO,
  AnnouncementDraft,
} from "../types/announcements";
import { apiUrl } from "./apiBase";

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
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

export async function fetchAnnouncements(): Promise<AnnouncementDTO[]> {
  const result = await request<{ announcements: AnnouncementDTO[] }>(
    "/api/announcements",
  );
  return result.announcements;
}

export async function createAnnouncement(
  draft: AnnouncementDraft,
): Promise<AnnouncementDTO> {
  const result = await request<{ announcement: AnnouncementDTO }>(
    "/api/announcements",
    { method: "POST", body: draft },
  );
  return result.announcement;
}

export async function updateAnnouncement(
  id: string,
  draft: AnnouncementDraft,
): Promise<AnnouncementDTO> {
  const result = await request<{ announcement: AnnouncementDTO }>(
    `/api/announcements/${encodeURIComponent(id)}`,
    { method: "PATCH", body: draft },
  );
  return result.announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await request<void>(`/api/announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
