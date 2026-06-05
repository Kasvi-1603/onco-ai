"""One-shot demo: POST /api/demo -> analyze -> dashboard (matches frontend flow)."""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


async def main() -> None:
    async with httpx.AsyncClient(timeout=600.0) as client:
        cases = (await client.get(f"{BASE}/api/cases")).json()
        print(f"GET /api/cases -> {len(cases)} preset case(s)")

        demo = (await client.post(f"{BASE}/api/demo?case_id=egfr-exon19")).json()
        session_id = demo["session_id"]
        print(f"POST /api/demo -> session_id={session_id}")

        t0 = time.time()
        analyze = await client.post(f"{BASE}/api/analyze/{session_id}")
        elapsed = time.time() - t0
        print(f"POST /api/analyze -> {analyze.status_code} in {elapsed:.1f}s")

        dashboard = (await client.get(f"{BASE}/api/dashboard/{session_id}")).json()
        top = (dashboard.get("similar_cohorts") or [{}])[0]
        print(
            f"GET /api/dashboard -> top match {top.get('cohort_id')} "
            f"({round((top.get('overall_score') or 0) * 100)}%)"
        )

        audit = (await client.get(f"{BASE}/api/audit/{session_id}")).json()
        llm = [
            e.get("model")
            for e in audit.get("entries") or []
            if e.get("step") in ("agent2", "doc_treatment", "doc_mdt")
        ][-3:]
        print(f"LLM models: {llm}")
        print("OK — frontend-from-test can use this session at /dashboard/" + session_id)


if __name__ == "__main__":
    asyncio.run(main())
