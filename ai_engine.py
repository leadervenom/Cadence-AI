"""
Cadence Engine - AI Engine (Gemini Wrapper)
Strict, schema-enforced Gemini calls. No free-form output tolerated.
"""

from __future__ import annotations
import os
import json
import logging
from typing import Any, Type
from pydantic import BaseModel, ValidationError
from google import genai

logger = logging.getLogger("cadence.ai_engine")

# ─── Client Init ──────────────────────────────────────────────────────────────

_client: genai.Client | None = None

def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")
        _client = genai.Client(api_key=api_key)
    return _client


# ─── System Prompt ────────────────────────────────────────────────────────────

CADENCE_SYSTEM_PROMPT = """You are Cadence Engine — a deterministic event management decision system.

STRICT RULES:
1. You ONLY output valid, parseable JSON. Nothing else.
2. No explanations, preambles, or markdown formatting.
3. No code blocks, no triple backticks, no "```json" wrappers.
4. No conversational language. No apologies. No questions.
5. Your entire response must be a single JSON object or array.
6. Follow the exact schema provided. Every field is mandatory unless marked optional.
7. If you cannot produce a valid result, output: {"error": "reason"}

You handle: running order generation, seating arrangement, and real-time event updates.
You do NOT answer general questions or produce any non-JSON output under any circumstances.
"""


# ─── Core Wrapper ─────────────────────────────────────────────────────────────

def call_gemini(
    prompt: str,
    response_model: Type[BaseModel] | None = None,
    max_retries: int = 2,
) -> tuple[dict, int]:
    """
    Call Gemini with a strict structured prompt.
    Returns (parsed_dict, retries_used).
    Raises ValueError if all retries exhausted.
    """
    client = get_client()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-preview-04-17")

    full_prompt = f"{CADENCE_SYSTEM_PROMPT}\n\n{prompt}"

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=full_prompt,
            )

            raw = response.text.strip()

            # Strip accidental markdown fences
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(
                    line for line in lines
                    if not line.strip().startswith("```")
                ).strip()

            parsed = json.loads(raw)

            # Validate against Pydantic model if provided
            if response_model is not None:
                response_model.model_validate(parsed)

            logger.info(f"Gemini call succeeded on attempt {attempt + 1}")
            return parsed, attempt

        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e} | Raw: {raw[:300]}"
            logger.warning(f"Attempt {attempt + 1} failed (JSON): {last_error}")

        except ValidationError as e:
            last_error = f"Schema validation error: {e}"
            logger.warning(f"Attempt {attempt + 1} failed (Schema): {last_error}")

        except Exception as e:
            last_error = f"Gemini API error: {e}"
            logger.warning(f"Attempt {attempt + 1} failed (API): {last_error}")

    raise ValueError(f"Gemini failed after {max_retries + 1} attempts. Last error: {last_error}")


# ─── Prompt Builders ──────────────────────────────────────────────────────────

def build_running_order_prompt(event_data: dict) -> str:
    schema = """
{
  "event_id": "string",
  "event_name": "string",
  "generated_at": "ISO 8601 datetime string",
  "total_duration_minutes": integer,
  "items": [
    {
      "sequence": integer (1-based),
      "item_id": "string (e.g. item_001)",
      "title": "string",
      "type": "session|break|keynote|panel|ceremony|networking|other",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration_minutes": integer,
      "speaker_id": "string or null",
      "speaker_name": "string or null",
      "location": "string or null",
      "notes": "string or null",
      "status": "scheduled"
    }
  ],
  "warnings": ["string"]
}
"""
    return f"""TASK: Generate an optimized running order for the following event.

RULES:
- Schedule ALL speakers with their required duration.
- Insert breaks as specified in the event data.
- Respect all constraints (gap_after, must_precede, fixed_time, etc.).
- No overlapping time slots.
- Stay within event start_time and end_time boundaries.
- Add a warnings array for any constraint conflicts or assumptions made.
- generated_at must be today's UTC datetime in ISO 8601 format.

OUTPUT SCHEMA (return exactly this structure):
{schema}

EVENT DATA:
{json.dumps(event_data, indent=2)}
"""


def build_seating_prompt(seating_data: dict) -> str:
    schema = """
{
  "event_id": "string",
  "generated_at": "ISO 8601 datetime string",
  "total_guests": integer,
  "total_tables": integer,
  "layout": [
    {
      "guest_id": "string",
      "guest_name": "string",
      "guest_title": "string",
      "table_id": "string",
      "table_number": integer,
      "seat_number": integer,
      "zone": "head|front|middle|rear|side",
      "vip_level": integer,
      "notes": "string or null"
    }
  ],
  "unassigned": ["guest_id strings"],
  "warnings": ["string"]
}
"""
    return f"""TASK: Generate a seating arrangement for the following event.

HIERARCHY RULES:
- vip_level 5 = highest priority, must be assigned to head or front zone first.
- rank (lower number = higher precedence) within same vip_level.
- role "keynote_speaker" and "official" take precedence over "vip_guest".
- Respect seating_constraints (e.g. "away_from:G002" means these guests must NOT share a table).
- Guests with accessibility=true must be placed at accessibility-enabled tables.
- head_table_guest_ids (if provided) must ALL be placed at zone="head" tables.
- Fill tables from highest zone (head) to lowest (rear).
- seat_number must be unique per table.

OUTPUT SCHEMA (return exactly this structure):
{schema}

SEATING DATA:
{json.dumps(seating_data, indent=2)}
"""


def build_update_prompt(update_data: dict) -> str:
    return f"""TASK: Apply real-time updates to the event running order and/or seating layout.

UPDATE RULES:
- "delay" type: push start_time and end_time of target item and all subsequent items by delta_minutes.
- "cancellation" type: set status="cancelled" for the target item; close the gap by shifting subsequent items forward.
- "vip_arrival" type: confirm guest assignment; add a note to their seating position.
- "vip_removal" type: remove guest from seating; mark seat as vacant; add warning.
- "venue_change" type: update location field on target agenda item.
- "time_change" type: set new start_time on target; recompute end_time using existing duration; cascade shifts.
- Recalculate total_duration_minutes after all changes.
- Return ONLY the modified running_order and/or seating_layout (whichever was affected).
- Add entries to warnings array for every change applied.

OUTPUT SCHEMA:
{{
  "running_order": {{...same RunningOrder schema...}} or null,
  "seating_layout": {{...same SeatingLayout schema...}} or null,
  "changes_applied": ["human-readable change description"],
  "warnings": ["string"]
}}

UPDATE REQUEST:
{json.dumps(update_data, indent=2)}
"""
