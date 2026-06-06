"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";

export default function ImagingPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: session, isLoading } = useSession(sessionId);
  const [slice, setSlice] = useState(38);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <EmptyPatientState />;

  const img = (session.patient as { imaging?: Record<string, unknown>; pathology?: Record<string, unknown> }).imaging ?? {};
  const path = (session.patient as { pathology?: Record<string, unknown> }).pathology ?? {};
  const size = Number(path.tumor_size_mm ?? 30);
  const noduleR = 5 + Math.sin(slice / 10) * 4;
  const diam = (noduleR * 4.2).toFixed(1);

  return (
    <>
      <DoctorTopBar title="Radiomics Extraction & Volumetric Segmentations" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-zinc-200 p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">DICOM Volumetric Slices</p>
          <div className="flex flex-col items-center gap-4">
            <svg width="160" height="160" viewBox="0 0 100 100" className="bg-zinc-100 rounded-full">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#d4d4d8" strokeWidth="1" />
              <ellipse cx="50" cy="50" rx="35" ry="25" fill="none" stroke="#a1a1aa" strokeWidth="0.7" />
              <circle cx="54" cy="42" r={noduleR} fill="rgba(14,165,160,0.25)" stroke="#0EA5A0" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
            <input
              type="range"
              min={10}
              max={60}
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
              className="w-full accent-[#0EA5A0]"
            />
            <p className="text-[10px] text-zinc-500">Slice Z: {slice} mm · Axial</p>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">AI Radiomic Feature Maps</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Max Target Diameter", `${diam} mm`],
              ["Nodule Density", "Solid"],
              ["Anatomical Lobe", String(img.lobe ?? "—")],
              ["N Stage", String(img.n_stage ?? "—")],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-zinc-200 p-3">
                <p className="text-[10px] text-zinc-400">{l}</p>
                <p className="text-lg font-semibold text-zinc-900 mt-1">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 leading-relaxed">
            <span className="text-xs text-[#0EA5A0] block mb-2 uppercase tracking-wider">Segmentation Summary</span>
            Primary lesion in {String(img.lobe ?? "—")}, {String(img.density ?? "solid")} density, approximate diameter{" "}
            {size}mm. Pleural invasion: {String(img.pleural_invasion ?? "—")}. Metastasis:{" "}
            {Array.isArray(img.metastasis_sites) ? (img.metastasis_sites as string[]).join(", ") : "—"}.
          </div>
        </div>
      </div>
    </>
  );
}
