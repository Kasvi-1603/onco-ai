"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAudit } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";

export default function AuditClient({ sessionId }: { sessionId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    getAudit(sessionId).then(setEntries).catch(console.error);
  }, [sessionId]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href={`/dashboard/${sessionId}`} className="text-xs text-blue-600">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Audit Trail</h1>
      <p className="text-sm text-slate-500">Session {sessionId}</p>
      <ol className="mt-6 space-y-3">
        {entries.map((e, i) => (
          <li key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-mono font-medium">{e.step}</span>
              <span className="text-xs text-slate-500">{e.timestamp}</span>
            </div>
            {e.model && <p className="text-xs text-slate-600">Model: {e.model}</p>}
            {e.retrieved_ids && e.retrieved_ids.length > 0 && (
              <p className="mt-1 text-xs text-emerald-700">
                IDs: {e.retrieved_ids.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
