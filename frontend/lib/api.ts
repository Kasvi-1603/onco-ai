import type { SessionPayload, UploadResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function createDemoSession(): Promise<UploadResponse> {
  return request<UploadResponse>("/api/demo", { method: "POST" });
}

export function uploadFiles(files: File[]): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return request<UploadResponse>("/api/upload", { method: "POST", body: form });
}

export function analyzeSession(sessionId: string): Promise<SessionPayload> {
  return request<SessionPayload>(`/api/analyze/${sessionId}`, { method: "POST" });
}

export function getDashboard(sessionId: string): Promise<SessionPayload> {
  return request<SessionPayload>(`/api/dashboard/${sessionId}`);
}

export function approveSession(sessionId: string): Promise<{ status: string }> {
  return request(`/api/dashboard/${sessionId}/approve`, { method: "POST" });
}

export function getAudit(sessionId: string) {
  return request(`/api/audit/${sessionId}`);
}
