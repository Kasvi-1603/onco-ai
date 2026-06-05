"""OCR / PDF text extraction."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


def extract_text_from_pdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            parts.append(text.strip())
    return "\n\n".join(parts)


def extract_text_from_file(path: Path) -> str:
    suffix = path.suffix.lower()
    data = path.read_bytes()
    if suffix == ".pdf":
        return extract_text_from_pdf(data)
    if suffix in (".txt", ".md"):
        return data.decode("utf-8", errors="replace")
    return data.decode("utf-8", errors="replace")


def extract_from_upload_dir(upload_dir: Path) -> str:
    parts: list[str] = []
    for f in sorted(upload_dir.iterdir()):
        if f.is_file():
            parts.append(f"--- {f.name} ---\n{extract_text_from_file(f)}")
    return "\n\n".join(parts)
