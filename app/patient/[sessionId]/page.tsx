"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import PatientDashboard from "../../../components/view2/PatientDashboard";

export default function PatientPortalPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  // Persist the sessionId in localStorage on load
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("active_patient_session_id", sessionId);
    }
  }, [sessionId]);

  if (!sessionId) return null;

  return <PatientDashboard sessionId={sessionId} />;
}
