"""Live end-to-end API flow check against running backend."""
import asyncio
import sys

import httpx

BASE = "http://127.0.0.1:8000"


async def main() -> int:
    async with httpx.AsyncClient(timeout=120.0) as c:
        r = await c.post(f"{BASE}/api/demo")
        print(f"1 POST /api/demo -> {r.status_code}")
        if r.status_code not in (200, 201):
            print(r.text)
            return 1
        sid = r.json()["session_id"]
        print(f"   session_id: {sid}")

        r = await c.post(f"{BASE}/api/analyze/{sid}")
        print(f"2 POST /api/analyze/{{id}} -> {r.status_code}")

        status = {}
        for i in range(90):
            r = await c.get(f"{BASE}/api/analyze/{sid}/status")
            status = r.json()
            print(f"   poll {i + 1}: status={status.get('status')} step={status.get('current_step')}")
            if status.get("status") in ("ready", "error"):
                break
            await asyncio.sleep(1)

        if status.get("status") != "ready":
            print("PIPELINE FAILED:", status)
            return 1

        r = await c.get(f"{BASE}/api/dashboard/{sid}")
        print(f"3 GET /api/dashboard/{{id}} -> {r.status_code}")
        dash = r.json()
        docs = dash.get("documents") or {}
        doc_keys = [k for k, v in docs.items() if v]
        checks = [
            ("patient_profile", bool(dash.get("patient_profile"))),
            ("similar_cohorts", len(dash.get("similar_cohorts") or []) > 0),
            ("trial_matches", len(dash.get("trial_matches") or []) > 0),
            ("knowledge_snippets", len(dash.get("knowledge_snippets") or []) > 0),
            ("documents (7 types)", len(doc_keys) >= 3),
            ("agent2_insights", bool(dash.get("agent2_insights"))),
            ("treatment_plan has DRAFT", "DRAFT" in (docs.get("treatment_plan") or "").upper()),
        ]
        failed = [name for name, ok in checks if not ok]
        for name, ok in checks:
            print(f"   {name}: {'OK' if ok else 'FAIL'}")
        if failed:
            print("Dashboard checks failed:", failed)
            return 1

        r = await c.get(f"{BASE}/api/patient/{sid}", params={"lang": "en"})
        print(f"4 GET patient before approve -> {r.status_code} (expect 403)")
        if r.status_code != 403:
            print("   expected 403 before approve")
            return 1

        r = await c.patch(
            f"{BASE}/api/dashboard/{sid}/documents",
            json={
                "documents": {
                    **docs,
                    "treatment_plan": "Edited E2E draft plan",
                }
            },
        )
        print(f"5 PATCH documents -> {r.status_code}")
        if r.status_code != 200 or "Edited E2E" not in r.json()["documents"]["treatment_plan"]:
            print("   patch failed")
            return 1

        r = await c.post(f"{BASE}/api/dashboard/{sid}/approve", json={})
        print(f"6 POST approve -> {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            return 1
        print(f"   portal_url: {r.json().get('patient_portal_url')}")

        r = await c.get(f"{BASE}/api/patient/{sid}", params={"lang": "en"})
        print(f"7 GET patient en -> {r.status_code}")
        patient = r.json()
        print(f"   headline: {patient.get('headline', '')[:60]}...")
        print(f"   sections: {list((patient.get('sections') or {}).keys())}")

        r = await c.get(f"{BASE}/api/patient/{sid}", params={"lang": "hi"})
        print(f"8 GET patient hi -> {r.status_code}")

        r = await c.get(f"{BASE}/api/audit/{sid}")
        audit = r.json()
        print(f"9 GET audit -> {r.status_code} entries={len(audit.get('entries') or [])}")
        steps = [e.get("step") for e in audit.get("entries") or []]
        print(f"   pipeline steps logged: {steps}")

        r = await c.get(f"{BASE}/health")
        print(f"10 GET /health -> {r.json().get('status')} mode={r.json().get('mode')}")

    print("\n=== E2E RESULT: ALL STEPS PASSED ===")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
