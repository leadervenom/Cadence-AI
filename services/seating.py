"""
Cadence Engine - Seating Service
Orchestrates AI calls for VIP seating arrangement.
"""

from __future__ import annotations
from datetime import datetime
from models import SeatingRequest, SeatingLayout
from ai_engine import call_gemini, build_seating_prompt


def generate_seating(request: SeatingRequest) -> tuple[SeatingLayout, int]:
    """
    Generate a seating layout for an event.
    Returns (SeatingLayout, retries_used).
    """
    seating_data = request.model_dump()
    prompt = build_seating_prompt(seating_data)

    raw, retries = call_gemini(prompt, response_model=SeatingLayout)

    if not raw.get("generated_at"):
        raw["generated_at"] = datetime.utcnow().isoformat()

    layout = SeatingLayout.model_validate(raw)
    return layout, retries
