import { useQuery } from "@tanstack/react-query";
import {
  SessionPayload,
  PipelineStatus,
  SessionDocuments,
  PatientLocalizedView,
  SupportedLang,
  AuditEntry,
  CaseSummary,
  UploadResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? "API error"), { status: res.status, body: err });
  }
  return res.json();
}

// ── Session / upload ────────────────────────────────────────────

export function listCases(): Promise<CaseSummary[]> {
  return api<CaseSummary[]>("/api/cases");
}

export function createDemoSession(caseId = "egfr-exon19"): Promise<UploadResponse> {
  return api<UploadResponse>(`/api/demo?case_id=${encodeURIComponent(caseId)}`, { method: "POST" });
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.detail ?? err.message ?? "Upload failed"), {
      status: res.status,
      body: err,
    });
  }
  return res.json();
}

// ── Pipeline ────────────────────────────────────────────────────

export const startAnalyze = (sessionId: string) =>
  api<SessionPayload>(`/api/analyze/${sessionId}`, { method: "POST" });

export const getPipelineStatus = (sessionId: string) =>
  api<PipelineStatus>(`/api/analyze/${sessionId}/status`);

// ── Dashboard ───────────────────────────────────────────────────

export const getDashboard = (sessionId: string) =>
  api<SessionPayload>(`/api/dashboard/${sessionId}`);

export const patchDocuments = (sessionId: string, documents: Partial<SessionDocuments>) =>
  api<SessionPayload>(`/api/dashboard/${sessionId}/documents`, {
    method: "PATCH",
    body: JSON.stringify({ documents }),
  });

export const approveSession = (
  sessionId: string,
  body?: { approved_documents?: Partial<SessionDocuments>; approver_note?: string }
) =>
  api<{ session_id: string; status: string; approved_at: string; patient_portal_url: string }>(
    `/api/dashboard/${sessionId}/approve`,
    { method: "POST", body: JSON.stringify(body ?? {}) }
  );

// ── Patient portal ────────────────────────────────────────────────

export const getPatientPortal = (sessionId: string, lang: SupportedLang = "en") =>
  api<PatientLocalizedView>(`/api/patient/${sessionId}?lang=${lang}`);

export const regeneratePatientSummary = (sessionId: string, lang: SupportedLang) =>
  api<PatientLocalizedView>(`/api/patient/${sessionId}/summary?lang=${lang}`, { method: "POST" });

// ── Audit ───────────────────────────────────────────────────────

export const getAuditTrail = (sessionId: string) =>
  api<{ session_id: string; entries: AuditEntry[] }>(`/api/audit/${sessionId}`);

// ── React Query Hooks ───────────────────────────────────────────

export function useDashboard(sessionId: string) {
  return useQuery<SessionPayload, Error>({
    queryKey: ["dashboard", sessionId],
    queryFn: () => getDashboard(sessionId),
    staleTime: 30000,
    enabled: !!sessionId,
  });
}

export function usePatientPortal(sessionId: string, lang: SupportedLang = "en") {
  return useQuery<PatientLocalizedView, Error>({
    queryKey: ["patient", sessionId, lang],
    queryFn: () => getPatientPortal(sessionId, lang),
    staleTime: 300000,
    enabled: !!sessionId,
    retry: false,
  });
}

export function usePipelineStatus(sessionId: string, isRunning: boolean) {
  return useQuery<PipelineStatus, Error>({
    queryKey: ["pipeline", sessionId],
    queryFn: () => getPipelineStatus(sessionId),
    refetchInterval: isRunning ? 2000 : false,
    enabled: !!sessionId,
  });
}

export function useAudit(sessionId: string) {
  return useQuery<{ session_id: string; entries: AuditEntry[] }, Error>({
    queryKey: ["audit", sessionId],
    queryFn: () => getAuditTrail(sessionId),
    staleTime: 60000,
    enabled: !!sessionId,
  });
}
export type { AuditEntry };
