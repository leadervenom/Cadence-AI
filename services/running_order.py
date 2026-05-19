"""
Cadence Engine - Running Order Service
Orchestrates AI calls for agenda/timeline generation.
"""

from __future__ import annotations
from datetime import datetime
from models import RunningOrderRequest, RunningOrder
from ai_engine import call_gemini, build_running_order_prompt


def generate_running_order(request: RunningOrderRequest) -> tuple[RunningOrder, int]:
    """
    Generate a complete running order for an event.
    Returns (RunningOrder, retries_used).
    """
    event_data = request.event.model_dump()
    prompt = build_running_order_prompt(event_data)

    raw, retries = call_gemini(prompt, response_model=RunningOrder)

    # Ensure generated_at is set
    if not raw.get("generated_at"):
        raw["generated_at"] = datetime.utcnow().isoformat()

    order = RunningOrder.model_validate(raw)
    return order, retries
