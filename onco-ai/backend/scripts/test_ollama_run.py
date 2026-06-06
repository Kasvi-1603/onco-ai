"""Single analyze run — print last audit models and elapsed time."""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


async def main() -> None:
    async with httpx.AsyncClient(timeout=600.0) as c:
        t0 = time.time()
        print("POST /api/analyze/demo-patient-001 (Groq should be off)...")
        r = await c.post(f"{BASE}/api/analyze/demo-patient-001")
        elapsed = time.time() - t0
        print(f"Status: {r.status_code} | Elapsed: {elapsed:.1f}s")

        audit = (await c.get(f"{BASE}/api/audit/demo-patient-001")).json()
        llm_steps = [
            e for e in audit.get("entries") or []
            if e.get("step") in ("agent2", "doc_treatment", "doc_mdt")
        ]
        print("\nLast 3 LLM steps from this run:")
        for e in llm_steps[-3:]:
            print(f"  {e['step']}: model={e.get('model')}")

        models = {e.get("model") for e in llm_steps[-3:]}
        if "mistral" in models:
            print("\nRESULT: Ollama (mistral) was used.")
        elif any(m and "llama-3" in str(m) for m in models):
            print("\nRESULT: Groq still used — check .env and restart server.")
        elif models <= {"fallback", None}:
            print("\nRESULT: Fallback templates only (Ollama may have failed).")


if __name__ == "__main__":
    asyncio.run(main())
