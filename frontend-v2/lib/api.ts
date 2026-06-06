import { useQuery } from "@tanstack/react-query";
import {
  DoctorSession,
  PatientLocalizedView,
  SessionDocuments,
  SessionPayload,
  SupportedLang,
  DemoUser,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.detail ?? err.message ?? "API error"), {
      status: res.status,
      body: err,
    });
  }
  return res.json();
}

export function listDemoUsers(): Promise<DemoUser[]> {
  return api<DemoUser[]>("/api/users");
}

export function loadDemoSession(sessionId: string): Promise<DoctorSession> {
  return api<DoctorSession>(`/api/sessions/${sessionId}/load`, { method: "POST" });
}

export async function uploadPatientJson(file: File): Promise<{ session_id: string }> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

export const getSession = (sessionId: string) =>
  api<DoctorSession>(`/api/sessions/${sessionId}`);

export const selectMatchCase = (sessionId: string, index: number) =>
  api<DoctorSession>(`/api/sessions/${sessionId}/case`, {
    method: "PATCH",
    body: JSON.stringify({ index }),
  });

export const getDashboard = (sessionId: string) =>
  api<SessionPayload>(`/api/dashboard/${sessionId}`);

export const patchDocuments = (sessionId: string, documents: Partial<SessionDocuments>) =>
  api<SessionPayload>(`/api/dashboard/${sessionId}/documents`, {
    method: "PATCH",
    body: JSON.stringify({ documents }),
  });

export const approveSession = (sessionId: string) =>
  api<{ session_id: string; status: string; approved_at: string; patient_portal_url: string }>(
    `/api/dashboard/${sessionId}/approve`,
    { method: "POST", body: JSON.stringify({}) }
  );

export const getPatientPortal = (sessionId: string, lang: SupportedLang = "en") =>
  api<PatientLocalizedView>(`/api/patient/${sessionId}?lang=${lang}`);

export const regeneratePatientSummary = (sessionId: string, lang: SupportedLang) =>
  api<PatientLocalizedView>(`/api/patient/${sessionId}/summary?lang=${lang}`, { method: "POST" });

export async function getAIRationale(prompt: string): Promise<string> {
  const data = await api<{ content?: { text: string }[] }>("/api/ai-rationale", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  return data.content?.[0]?.text ?? "Unable to generate rationale.";
}

export function useSession(sessionId: string) {
  return useQuery<DoctorSession, Error>({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    staleTime: 10000,
    enabled: !!sessionId,
  });
}

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
