"use client";

import { useParams } from "next/navigation";
import PatientDashboard from "@/components/view2/PatientDashboard";

export default function PatientPortalPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  if (!sessionId) return null;
  return <PatientDashboard sessionId={sessionId} />;
}
