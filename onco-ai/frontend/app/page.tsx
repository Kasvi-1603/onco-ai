"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { analyzeSession, createDemoSession, uploadFiles } from "@/lib/api";
import { PipelineProgress } from "@/components/shared/PipelineProgress";

const STEPS = ["upload", "extract", "retrieve", "generate", "done"] as const;

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<(typeof STEPS)[number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runPipeline = useCallback(
    async (sessionId: string) => {
      setStep("extract");
      await new Promise((r) => setTimeout(r, 400));
      setStep("retrieve");
      await new Promise((r) => setTimeout(r, 400));
      setStep("generate");
      await analyzeSession(sessionId);
      setStep("done");
      router.push(`/dashboard/${sessionId}`);
    },
    [router]
  );

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    setStep("upload");
    try {
      const { session_id } = await createDemoSession();
      await runPipeline(session_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo failed");
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setError(null);
    setLoading(true);
    setStep("upload");
    try {
      const { session_id } = await uploadFiles(files);
      await runPipeline(session_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Oncopilot AI</h1>
      <p className="mt-2 text-slate-600">
        Upload pathology, genomics, and clinical reports. Analysis is draft-only — for oncologist review.
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Clinical documents</label>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          className="mt-2 block w-full text-sm"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        {files.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{files.length} file(s) selected</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || !files.length}
            onClick={handleUpload}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Upload & Analyze
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDemo}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            Demo Patient (SYN-001 match)
          </button>
        </div>
      </div>

      {step && <PipelineProgress step={step} />}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </main>
  );
}
