"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { ReactNode } from "react";
import {
  Radar,
  Dna,
  Scan,
  Users,
  FileText,
  FileEdit,
  LogOut,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ApproveShareButton from "@/components/view1/ApproveShareButton";
import PatientFileUpload from "@/components/doctor/PatientFileUpload";
import { useSession } from "@/lib/api";

const NAV = [
  { href: "similarity", label: "Case Similarity", icon: Radar, phase: "Phase 1: Discovery" },
  { href: "genomic", label: "Genomic Profile", icon: Dna, phase: null },
  { href: "imaging", label: "Imaging Params", icon: Scan, phase: null },
  { href: "tumor-board", label: "Tumor Board Brief", icon: Users, phase: "Phase 2: Consensus" },
  { href: "summary", label: "Patient Summary", icon: FileText, phase: null },
  { href: "editor", label: "Document Editor", icon: FileEdit, phase: null },
] as const;

export default function DoctorShell({ children }: { children: ReactNode }) {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession(sessionId);

  const base = `/doctor/${sessionId}`;

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", sessionId] });
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-60 shrink-0 border-r border-zinc-200 flex flex-col bg-white">
        <div className="p-4 border-b border-zinc-200">
          <Link href="/doctor" className="text-lg font-bold text-zinc-900" style={{ fontFamily: "Syne" }}>
            OncoPilot
          </Link>
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider">Clinical AI · TCGA</p>
        </div>

        {session && (
          <div className="mx-3 mt-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-[9px] uppercase tracking-wider text-zinc-400">Active Patient</p>
            <p className="text-sm font-medium text-zinc-900 mt-0.5">{session.patient_name}</p>
            <p className="text-[10px] text-[#0EA5A0] mt-0.5">
              {(session.patient as { genomics?: { driver_mutation?: string } })?.genomics?.driver_mutation ?? "—"} ·{" "}
              {(session.patient as { clinical?: { stage?: string } })?.clinical?.stage ?? "—"}
            </p>
            <p className="text-[9px] text-zinc-400 mt-1.5">
              Portal ID: <span className="font-mono font-semibold text-zinc-600">{sessionId}</span>
            </p>
          </div>
        )}

        <div className="mx-3 mt-2">
          <p className="text-[9px] uppercase tracking-wider text-zinc-400 px-1 mb-1.5">
            Import EHR Record
          </p>
          <PatientFileUpload compact onSuccess={(id) => router.push(`/doctor/${id}/similarity`)} />
        </div>

        <nav className="flex-1 overflow-y-auto p-2 mt-2">
          {NAV.map((item, i) => {
            const prev = NAV[i - 1];
            const showPhase = item.phase && item.phase !== prev?.phase;
            const href = `${base}/${item.href}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {showPhase && (
                  <p className="text-[9px] uppercase tracking-wider text-zinc-400 px-2 pt-3 pb-1">
                    {item.phase}
                  </p>
                )}
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 border-l-[3px] transition-colors ${
                    active
                      ? "border-[#0EA5A0] bg-[#ecfdf9] text-[#0d9488]"
                      : "border-transparent text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {item.href === "similarity" && session?.match_results?.length ? (
                    <span className="ml-auto text-[10px] font-bold bg-[#0EA5A0] text-white px-1.5 py-0.5 rounded">
                      {session.match_results.length}
                    </span>
                  ) : null}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200 space-y-2">
          {session && (
            <>
              <ApproveShareButton
                sessionId={sessionId}
                initialStatus={session.status}
                approvedAt={session.approved_at}
                onApproveSuccess={() => invalidateSession()}
              />
              {session.status !== "shared" && (
                <p className="text-[9px] text-zinc-400 leading-snug px-0.5">
                  Patient portal at <span className="font-mono">/patient/{sessionId}</span> unlocks after
                  Approve &amp; Share.
                </p>
              )}
            </>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("role");
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 py-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export function DoctorTopBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
      <h2 className="text-base font-semibold text-zinc-900" style={{ fontFamily: "Syne" }}>
        {title}
      </h2>
      {children}
    </header>
  );
}

export function EmptyPatientState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <Upload className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-800">No Patient Loaded</h3>
        <p className="text-sm text-zinc-500 mt-2">
          Select a demo patient or upload a JSON record from the doctor home page.
        </p>
        <Link
          href="/doctor"
          className="inline-block mt-4 text-sm font-medium text-[#0EA5A0] hover:underline"
        >
          ← Back to patient selection
        </Link>
      </div>
    </div>
  );
}
