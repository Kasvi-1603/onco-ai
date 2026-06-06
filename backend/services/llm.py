"""Shared LLM client — Groq → Ollama → template fallback."""

from __future__ import annotations

import json
import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)


async def complete(
    system: str,
    user: str,
    *,
    temperature: float = 0.15,
    json_mode: bool = False,
) -> tuple[str, str]:
    """Returns (text, model_used)."""
    if settings.groq_api_key:
        try:
            text = await _groq_complete(system, user, temperature, json_mode)
            return text, settings.groq_model
        except Exception as e:
            logger.warning("Groq failed: %s", e)

    try:
        text = await _ollama_complete(system, user, temperature)
        return text, settings.ollama_model
    except Exception as e:
        logger.warning("Ollama failed: %s", e)

    return "", "fallback"


async def _groq_complete(
    system: str, user: str, temperature: float, json_mode: bool
) -> str:
    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.groq_api_key)
    kwargs: dict = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = await client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


async def _ollama_complete(system: str, user: str, temperature: float) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "stream": False,
                "options": {"temperature": temperature},
            },
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


def parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)
