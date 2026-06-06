"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "doctor" | "patient";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("doctor");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Enter a user ID");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (tab === "patient") {
      localStorage.setItem("role", "patient");
      localStorage.setItem("patientUserId", username.trim());
      router.push(`/patient/${username.trim()}`);
    } else {
      localStorage.setItem("role", "doctor");
      router.push("/doctor");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900" style={{ fontFamily: "Syne, sans-serif" }}>
            OncoPilot
          </h1>
          <p className="text-sm text-zinc-500 mt-2">Clinical AI · TCGA-LUAD</p>
        </div>

        <div className="flex rounded-lg border border-zinc-200 p-1 mb-6 bg-zinc-50">
          {(["doctor", "patient"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? "bg-white text-[#0EA5A0] shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "doctor" ? "Oncologist" : "Patient"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              {tab === "doctor" ? "Username" : "Patient User ID"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={tab === "doctor" ? "doctor" : "2"}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0EA5A0] focus:border-[#0EA5A0]"
            />
            {tab === "patient" && (
              <p className="text-[11px] text-zinc-400 mt-1">Demo IDs: 2, 3, 4, 5</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="any password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0EA5A0] focus:border-[#0EA5A0]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0EA5A0] text-white py-2.5 text-sm font-semibold hover:bg-[#0d9488] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
