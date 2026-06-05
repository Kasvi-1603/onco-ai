import pytesseract
from PIL import Image
from pypdf import PdfReader
import io
from pathlib import Path

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF — tries direct text first, then OCR."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages_text = []

    for page in reader.pages:
        text = page.extract_text()
        if text and len(text.strip()) > 50:
            # PDF has real text — no OCR needed
            pages_text.append(text)
        else:
            # Scanned page — render to image and OCR
            # pypdf doesn't render images natively; skip pixel OCR for hackathon
            pages_text.append("[Scanned page — OCR skipped for hackathon]")

    return "\n\n".join(pages_text)

def extract_text_from_image(file_bytes: bytes) -> str:
    """Run Tesseract OCR on an image file."""
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)

def extract_text(filename: str, file_bytes: bytes) -> str:
    """Route to the right extractor based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in [".png", ".jpg", ".jpeg", ".tiff"]:
        return extract_text_from_image(file_bytes)
    elif ext == ".txt":
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        return file_bytes.decode("utf-8", errors="ignore")