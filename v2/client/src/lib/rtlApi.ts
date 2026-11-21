import type { NoteStatus } from "../types/policyNotes";
import type { RtlPlanDTO, RtlPlanDraft } from "../types/rtl";
import { apiUrl } from "./apiBase";

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
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

export async function fetchRtlPlans(): Promise<RtlPlanDTO[]> {
  const result = await request<{ plans: RtlPlanDTO[] }>("/api/rtl");
  return result.plans;
}

export async function createRtlPlan(
  draft: RtlPlanDraft,
): Promise<RtlPlanDTO> {
  const result = await request<{ plan: RtlPlanDTO }>("/api/rtl", {
    method: "POST",
    body: draft,
  });
  return result.plan;
}

export async function updateRtlPlan(
  id: string,
  fields: Partial<Pick<RtlPlanDraft, "habitCategory" | "targetScope" | "planContent" | "responsibleRole">> & { status?: NoteStatus },
): Promise<RtlPlanDTO> {
  const result = await request<{ plan: RtlPlanDTO }>(
    `/api/rtl/${encodeURIComponent(id)}`,
    { method: "PATCH", body: fields },
  );
  return result.plan;
}

export async function deleteRtlPlan(id: string): Promise<void> {
  await request<void>(`/api/rtl/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
