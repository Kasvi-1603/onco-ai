"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileJson } from "lucide-react";
import { uploadPatientJson, loadDemoSession } from "@/lib/api";
import PipelineProgress, {
  PipelineStep,
  runPipelineAnimation,
} from "@/components/shared/PipelineProgress";

interface PatientFileUploadProps {
  compact?: boolean;
  onSuccess?: (sessionId: string) => void;
}

export default function PatientFileUpload({
  compact,
  onSuccess,
}: PatientFileUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const finish = useCallback(
    (sessionId: string) => {
      if (onSuccess) onSuccess(sessionId);
      else router.push(`/doctor/${sessionId}/similarity`);
    },
    [onSuccess, router]
  );

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Only .json patient EHR files are supported.");
      return;
    }
    setError("");
    setBusy(true);
    setFileName(file.name);
    try {
      const sessionId = await runPipelineAnimation(setPipelineStep, () =>
        uploadPatientJson(file)
      );
      finish(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPipelineStep(null);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !busy) processFile(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  if (pipelineStep) {
    return (
      <div className="space-y-3">
        {fileName && (
          <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5 shrink-0" />
            {fileName}
          </p>
        )}
        <PipelineProgress step={pipelineStep} compact={compact} />
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed transition-colors ${
          compact ? "p-3" : "p-6"
        } ${
          dragOver
            ? "border-[#0EA5A0] bg-[#ecfdf9]"
            : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400"
        } ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileInput}
        />
        <div className={`text-center ${compact ? "py-1" : "py-2"}`}>
          <Upload
            className={`mx-auto text-zinc-400 ${compact ? "w-6 h-6 mb-1" : "w-8 h-8 mb-2"}`}
          />
          <p className={`font-semibold text-zinc-800 ${compact ? "text-[11px]" : "text-sm"}`}>
            {compact ? "Upload EHR JSON" : "Drop patient JSON here"}
          </p>
          {!compact && (
            <p className="text-xs text-zinc-500 mt-1">
              or use the button below — e.g. <code className="text-[10px]">patient_upload copy 2.json</code>
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={`mt-3 rounded-lg bg-[#0EA5A0] text-white font-semibold hover:bg-[#0d9488] transition-colors disabled:opacity-50 ${
              compact ? "w-full px-3 py-2 text-[11px]" : "px-5 py-2.5 text-sm"
            }`}
          >
            Upload &amp; Run Analysis
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {!compact && (
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Tip: files named <strong>patient_upload copy 2.json</strong> map to patient portal ID{" "}
          <strong>2</strong> so doctor and patient share the same session after Approve &amp; Share.
        </p>
      )}
    </div>
  );
}

/** Run pipeline animation for demo patient load (no file upload). */
export async function runDemoPatientLoad(
  sessionId: string,
  setStep: (s: PipelineStep) => void,
  onDone: (id: string) => void
) {
  setStep("ingest");
  const t1 = setTimeout(() => setStep("validate"), 300);
  const t2 = setTimeout(() => setStep("match"), 700);
  try {
    await loadDemoSession(sessionId);
    clearTimeout(t1);
    clearTimeout(t2);
    setStep("documents");
    await new Promise((r) => setTimeout(r, 300));
    setStep("ready");
    await new Promise((r) => setTimeout(r, 400));
    onDone(sessionId);
  } catch (e) {
    clearTimeout(t1);
    clearTimeout(t2);
    throw e;
  }
}
