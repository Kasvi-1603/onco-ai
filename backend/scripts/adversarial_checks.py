"""Adversarial / edge-case checks — expects correct HTTP errors, catches real bugs."""
import asyncio
import sys

import httpx

BASE = "http://127.0.0.1:8000"
FAILURES: list[str] = []
PASSED: list[str] = []


def ok(name: str) -> None:
    PASSED.append(name)
    print(f"  PASS  {name}")


def fail(name: str, detail: str) -> None:
    FAILURES.append(f"{name}: {detail}")
    print(f"  FAIL  {name}: {detail}")


def expect_status(name: str, r: httpx.Response, code: int) -> bool:
    if r.status_code == code:
        ok(name)
        return True
    fail(name, f"expected {code}, got {r.status_code}: {r.text[:200]}")
    return False


async def main() -> int:
    async with httpx.AsyncClient(timeout=120.0) as c:
        print("=== ADVERSARIAL API CHECKS ===\n")

        # --- 404s ---
        r = await c.get(f"{BASE}/api/dashboard/nonexistent-session-xyz")
        expect_status("404 dashboard missing session", r, 404)

        r = await c.post(f"{BASE}/api/analyze/fake-id-999")
        expect_status("404 analyze missing session", r, 404)

        r = await c.get(f"{BASE}/api/analyze/fake-id-999/status")
        expect_status("404 status missing session", r, 404)

        r = await c.get(f"{BASE}/api/patient/nonexistent?lang=en")
        expect_status("404 patient missing session", r, 404)

        r = await c.get(f"{BASE}/api/audit/nonexistent")
        expect_status("404 audit missing session", r, 404)

        # --- Wrong order: dashboard before analyze ---
        r = await c.post(f"{BASE}/api/demo")
        if r.status_code not in (200, 201):
            fail("demo create", str(r.status_code))
            return 1
        sid = r.json()["session_id"]
        ok(f"demo session created: {sid}")

        r = await c.get(f"{BASE}/api/dashboard/{sid}")
        expect_status("425 dashboard before analyze", r, 425)

        r = await c.get(f"{BASE}/api/patient/{sid}?lang=en")
        expect_status("403 patient before approve (uploaded state)", r, 403)

        # --- Analyze ---
        r = await c.post(f"{BASE}/api/analyze/{sid}")
        if r.status_code != 200:
            fail("analyze", f"{r.status_code} {r.text[:200]}")
        else:
            ok("analyze completes")

        # --- Double analyze (should not crash) ---
        r2 = await c.post(f"{BASE}/api/analyze/{sid}")
        if r2.status_code == 200:
            ok("double analyze returns 200 (re-runs pipeline)")
            if not r2.json().get("similar_cohorts"):
                fail("double analyze", "missing similar_cohorts on re-run")
        else:
            fail("double analyze", f"{r2.status_code}")

        # --- Dashboard after analyze ---
        r = await c.get(f"{BASE}/api/dashboard/{sid}")
        if r.status_code != 200:
            fail("dashboard after analyze", str(r.status_code))
        else:
            dash = r.json()
            ok("dashboard after analyze")
            if dash.get("status") not in ("pending", "uploaded"):
                ok(f"session status={dash.get('status')}")
            if not dash.get("agent2_insights"):
                fail("dashboard payload", "agent2_insights missing")
            if len(dash.get("similar_cohorts") or []) == 0:
                fail("dashboard payload", "similar_cohorts empty")
            docs = dash.get("documents") or {}
            if not docs.get("treatment_plan"):
                fail("dashboard payload", "treatment_plan empty")
            elif "DRAFT" not in docs.get("treatment_plan", "").upper():
                fail("safety", "treatment_plan missing DRAFT label")

        # --- Invalid lang ---
        r = await c.get(f"{BASE}/api/patient/{sid}?lang=xx")
        if r.status_code == 422:
            ok("422 invalid lang query param")
        else:
            fail("invalid lang", f"expected 422, got {r.status_code}")

        # --- Patch with bad body ---
        r = await c.patch(f"{BASE}/api/dashboard/{sid}/documents", json={})
        if r.status_code == 422:
            ok("422 patch missing documents field")
        else:
            fail("patch bad body", f"expected 422, got {r.status_code}")

        # --- Approve without prior patch (should still work) ---
        r = await c.post(f"{BASE}/api/dashboard/{sid}/approve", json={})
        if r.status_code != 200:
            fail("approve", f"{r.status_code} {r.text[:200]}")
        else:
            ok("approve succeeds")
            if r.json().get("status") != "shared":
                fail("approve response", f"status={r.json().get('status')}")

        # --- Patient after approve ---
        for lang in ("en", "hi", "ta", "kn"):
            r = await c.get(f"{BASE}/api/patient/{sid}", params={"lang": lang})
            if r.status_code != 200:
                fail(f"patient lang={lang}", str(r.status_code))
            else:
                sections = r.json().get("sections") or {}
                if not sections.get("what_we_found"):
                    fail(f"patient lang={lang}", "what_we_found empty")
                else:
                    ok(f"patient portal lang={lang}")

        # --- Double approve ---
        r = await c.post(f"{BASE}/api/dashboard/{sid}/approve", json={})
        if r.status_code == 200:
            ok("double approve idempotent (200)")
        else:
            fail("double approve", str(r.status_code))

        # --- Audit trail ---
        r = await c.get(f"{BASE}/api/audit/{sid}")
        if r.status_code != 200:
            fail("audit", str(r.status_code))
        else:
            entries = r.json().get("entries") or []
            ok(f"audit has {len(entries)} entries")
            steps = {e.get("step") for e in entries}
            for required in ("similarity", "trial_match", "agent2"):
                if required in steps:
                    ok(f"audit contains step={required}")
                else:
                    fail("audit completeness", f"missing step {required}")

        # --- Status consistency ---
        r = await c.get(f"{BASE}/api/analyze/{sid}/status")
        st = r.json()
        if st.get("status") == "ready":
            ok("status endpoint says ready after analyze")
        else:
            fail("status consistency", str(st))

        # --- Health ---
        r = await c.get(f"{BASE}/health")
        h = r.json()
        if h.get("status") == "ok" and h.get("mode") == "simulated":
            ok("health ok + simulated mode")
        else:
            fail("health", str(h))

    print(f"\n=== RESULT: {len(PASSED)} passed, {len(FAILURES)} failed ===")
    if FAILURES:
        for f in FAILURES:
            print(f"  ! {f}")
        return 1
    print("All adversarial checks passed — no breaks found.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
