"""
Protocol parsing utilities for PDF, DOCX, and TXT uploads.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

import pdfplumber
from docx import Document


SUPPORTED_PROTOCOL_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_protocol_text(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_PROTOCOL_EXTENSIONS:
        raise ValueError("Unsupported file type. Use PDF, DOCX, or TXT.")

    if ext == ".pdf":
        return _extract_pdf_text(content)
    if ext == ".docx":
        return _extract_docx_text(content)
    return _extract_txt_text(content)


def _extract_pdf_text(content: bytes) -> str:
    chunks: list[str] = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                chunks.append(page_text.strip())
    text = "\n\n".join(chunks).strip()
    if not text:
        raise ValueError("No readable text found in PDF.")
    return text


def _extract_docx_text(content: bytes) -> str:
    doc = Document(BytesIO(content))
    chunks = [paragraph.text.strip() for paragraph in doc.paragraphs if paragraph.text.strip()]
    text = "\n\n".join(chunks).strip()
    if not text:
        raise ValueError("No readable text found in DOCX.")
    return text


def _extract_txt_text(content: bytes) -> str:
    text = content.decode("utf-8", errors="replace").strip()
    if not text:
        raise ValueError("Uploaded TXT file is empty.")
    return text
