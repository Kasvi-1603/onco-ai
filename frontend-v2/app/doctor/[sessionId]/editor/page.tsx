"use client";

import { useParams } from "next/navigation";
import { useDashboard } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";
import DocumentEditor from "@/components/view1/DocumentEditor";

export default function EditorPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: payload, isLoading, refetch } = useDashboard(sessionId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!payload) return <EmptyPatientState />;

  return (
    <>
      <DoctorTopBar title="Document Editor" />
      <div className="flex-1 overflow-y-auto p-6">
        <DocumentEditor
          sessionId={sessionId}
          initialDocuments={payload.documents}
          sourceSnippets={payload.patient_profile.source_snippets ?? {}}
          onSaveSuccess={() => refetch()}
        />
      </div>
    </>
  );
}
