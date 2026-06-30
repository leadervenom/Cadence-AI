from __future__ import annotations

import json
import re
from datetime import datetime

from fastapi import HTTPException
from pydantic import BaseModel, ValidationError

from .gemini_client import generate_content, get_default_model
from .schemas import ProtocolExtraction, RunningOrder


CADENCE_SYSTEM_PROMPT = """You are Cadence Engine, a deterministic event management system.

STRICT RULES:
1. Output valid JSON only.
2. No markdown, no code fences, no preamble.
3. Follow the requested schema exactly.
4. If information is missing, infer a safe operational value and list the assumption in warnings.
"""


def call_gemini_json(
    prompt: str,
    response_model: type[BaseModel] | None = None,
    max_retries: int = 2,
    model: str | None = None,
) -> tuple[dict, int]:
    last_error = ""
    full_prompt = f"{CADENCE_SYSTEM_PROMPT}\n\n{prompt}"
    model_name = model or get_default_model()

    for attempt in range(max_retries + 1):
        raw = ""
        try:
            raw = generate_content(model_name, full_prompt).strip()
            if raw.startswith("```"):
                raw = "\n".join(
                    line for line in raw.splitlines()
                    if not line.strip().startswith("```")
                ).strip()

            parsed = json.loads(raw)
            if response_model is not None:
                response_model.model_validate(parsed)
            return parsed, attempt
        except (json.JSONDecodeError, ValidationError, HTTPException) as error:
            last_error = f"{type(error).__name__}: {error}"
            full_prompt = (
                f"{CADENCE_SYSTEM_PROMPT}\n\n"
                f"The previous response was invalid: {last_error}\n"
                f"Return corrected JSON only.\n\n{prompt}"
            )

    raise HTTPException(
        status_code=502,
        detail=f"Gemini failed to return valid JSON. Last error: {last_error}",
    )


def build_protocol_running_order_prompt(protocol_text: str) -> str:
    schema = """
{
  "event_id": "string",
  "event_name": "string",
  "generated_at": "ISO 8601 datetime string",
  "total_duration_minutes": 0,
  "items": [
    {
      "sequence": 1,
      "item_id": "item_001",
      "title": "string",
      "type": "session|break|keynote|panel|ceremony|networking|other",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration_minutes": 0,
      "speaker_id": null,
      "speaker_name": null,
      "location": null,
      "notes": null,
      "status": "scheduled"
    }
  ],
  "warnings": ["string"]
}
"""
    return f"""TASK: Extract a professional event running order from protocol document text.

REQUIREMENTS:
- Keep sequence numbers contiguous starting at 1.
- Use HH:MM 24-hour start_time and end_time.
- duration_minutes must always be an integer.
- Use only these type values: session, break, keynote, panel, ceremony, networking, other.
- Map performance, arrival, opening, prayer, address, meal, photo, and departure into the closest allowed type.
- If timing is incomplete, infer a realistic schedule and put the assumption in warnings.
- generated_at must be {datetime.utcnow().isoformat()}.

OUTPUT SCHEMA:
{schema}

PROTOCOL DOCUMENT TEXT:
{protocol_text}
"""


def build_protocol_extraction_prompt(protocol_text: str) -> str:
    schema = """
{
  "running_order": {
    "event_id": "string",
    "event_name": "string",
    "generated_at": "ISO 8601 datetime string",
    "total_duration_minutes": 0,
    "items": [
      {
        "sequence": 1,
        "item_id": "item_001",
        "title": "string",
        "type": "session|break|keynote|panel|ceremony|networking|other",
        "start_time": "HH:MM",
        "end_time": "HH:MM",
        "duration_minutes": 0,
        "speaker_id": null,
        "speaker_name": null,
        "location": null,
        "notes": null,
        "status": "scheduled"
      }
    ],
    "warnings": ["string"]
  },
  "vips": [
    {
      "name": "string",
      "title": "string",
      "category": "royalty|vvip|vip|official|guest",
      "rank": 1,
      "status": "invited|confirmed|declined|absent|arrived|attended"
    }
  ],
  "warnings": ["string"]
}
"""
    return f"""TASK: Read the uploaded event protocol/tentative document and extract operational event data.

YOU HAVE THE FULL PARSED DOCUMENT TEXT BELOW. Do not say you cannot read uploaded files.

EXTRACT:
- A practical running order from agenda/tentative/programme sections.
- A VIP/guest list from attendee, invitee, speaker, protocol, VVIP, VIP, guest, committee, or dignitary sections.

RUNNING ORDER RULES:
- Keep sequence numbers contiguous starting at 1.
- Use HH:MM 24-hour start_time and end_time.
- duration_minutes must always be an integer.
- Use only these type values: session, break, keynote, panel, ceremony, networking, other.
- If timing is incomplete, infer a safe schedule and list the assumption in warnings.

VIP/GUEST RULES:
- Lower rank means higher protocol precedence.
- Use category royalty, vvip, vip, official, or guest.
- If no explicit attendance status exists, use invited.
- If no VIPs are found, return an empty list.

OUTPUT SCHEMA:
{schema}

PROTOCOL DOCUMENT TEXT:
{protocol_text}
"""


def generate_running_order_from_protocol(protocol_text: str) -> tuple[RunningOrder, int]:
    raw, retries = call_gemini_json(
        build_protocol_running_order_prompt(protocol_text),
        response_model=RunningOrder,
    )
    return RunningOrder.model_validate(raw), retries


def generate_event_data_from_protocol(protocol_text: str) -> tuple[ProtocolExtraction, int]:
    try:
        raw, retries = call_gemini_json(
            build_protocol_extraction_prompt(protocol_text),
            response_model=ProtocolExtraction,
        )
        return ProtocolExtraction.model_validate(raw), retries
    except HTTPException as error:
        fallback = extract_event_data_without_ai(protocol_text)
        fallback.warnings.append(f"Gemini extraction failed, used local parser: {error.detail}")
        return fallback, -1


def running_order_to_frontend_rows(order: RunningOrder) -> list[dict]:
    rows = []
    for item in order.items:
        rows.append({
            "time": f"{item.start_time}-{item.end_time}",
            "dur": f"{item.duration_minutes}m",
            "activity": item.title,
            "loc": item.location or "",
            "role": item.speaker_name or item.notes or "",
            "status": "pending" if item.status == "scheduled" else item.status,
        })
    return rows


def vips_to_frontend_rows(extraction: ProtocolExtraction) -> list[dict]:
    return [
        {
            "name": vip.name,
            "title": vip.title,
            "category": vip.category,
            "rank": vip.rank,
            "status": vip.status,
        }
        for vip in extraction.vips
    ]


def extract_event_data_without_ai(protocol_text: str) -> ProtocolExtraction:
    rows = extract_running_order_rows(protocol_text)
    vips = extract_vip_rows(protocol_text)
    items = []

    for index, row in enumerate(rows, start=1):
        start_time, end_time = split_time_range(row["time"])
        duration = duration_minutes(start_time, end_time)
        items.append({
            "sequence": index,
            "item_id": f"item_{index:03d}",
            "title": row["activity"],
            "type": classify_activity(row["activity"]),
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": duration,
            "speaker_id": None,
            "speaker_name": None,
            "location": row["loc"] or None,
            "notes": row["role"] or None,
            "status": "scheduled",
        })

    if not items:
        items.append({
            "sequence": 1,
            "item_id": "item_001",
            "title": "Review uploaded tentative document",
            "type": "other",
            "start_time": "09:00",
            "end_time": "09:15",
            "duration_minutes": 15,
            "speaker_id": None,
            "speaker_name": None,
            "location": None,
            "notes": "No explicit timed agenda lines were detected.",
            "status": "scheduled",
        })

    total_duration = sum(item["duration_minutes"] for item in items)
    order = RunningOrder.model_validate({
        "event_id": "uploaded_protocol",
        "event_name": infer_event_name(protocol_text),
        "generated_at": datetime.utcnow().isoformat(),
        "total_duration_minutes": total_duration,
        "items": items,
        "warnings": ["Generated by local parser from parsed document text."],
    })

    return ProtocolExtraction.model_validate({
        "running_order": order.model_dump(),
        "vips": vips,
        "warnings": ["Generated by local parser from parsed document text."],
    })


def extract_running_order_rows(protocol_text: str) -> list[dict]:
    rows = []
    lines = [line.strip(" \t-|") for line in protocol_text.splitlines()]
    time_range = re.compile(
        r"\b(?P<start>[0-2]?\d[:.][0-5]\d)\s*(?:-|–|—|to|hingga|until)\s*(?P<end>[0-2]?\d[:.][0-5]\d)\b",
        re.IGNORECASE,
    )
    single_time = re.compile(r"\b(?P<start>[0-2]?\d[:.][0-5]\d)\b")

    for line in lines:
        if len(line) < 5:
            continue

        match = time_range.search(line)
        if match:
            start = normalize_time(match.group("start"))
            end = normalize_time(match.group("end"))
            activity = clean_activity(line.replace(match.group(0), ""))
            if activity:
                rows.append(make_row(start, end, activity))
            continue

        match = single_time.search(line)
        if match and likely_agenda_line(line):
            start = normalize_time(match.group("start"))
            activity = clean_activity(line.replace(match.group(0), ""))
            if activity:
                rows.append(make_row(start, add_minutes(start, 15), activity))

    rows.sort(key=lambda row: split_time_range(row["time"])[0])
    for index in range(len(rows) - 1):
        current_start, current_end = split_time_range(rows[index]["time"])
        next_start, _ = split_time_range(rows[index + 1]["time"])
        if current_end == add_minutes(current_start, 15) and next_start > current_start:
            rows[index]["time"] = f"{current_start}-{next_start}"
            rows[index]["dur"] = f"{duration_minutes(current_start, next_start)}m"

    return rows


def extract_vip_rows(protocol_text: str) -> list[dict]:
    markers = re.compile(
        r"\b(DYMM|YAM|YAB|YBHG|YB|DATO|DATUK|TAN SRI|PUAN SRI|PROF\.?|DR\.?|SULTAN|MENTERI|VIP|VVIP)\b",
        re.IGNORECASE,
    )
    seen = set()
    vips = []

    for line in protocol_text.splitlines():
        cleaned = clean_activity(line)
        if len(cleaned) < 6 or not markers.search(cleaned):
            continue
        if re.search(r"\b[0-2]?\d[:.][0-5]\d\b", cleaned):
            continue
        if any(word in cleaned.lower() for word in ["atur cara", "tentative", "masa", "time"]):
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        vips.append({
            "name": cleaned[:180],
            "title": "",
            "category": classify_vip(cleaned),
            "rank": len(vips) + 1,
            "status": "invited",
        })
        if len(vips) >= 30:
            break

    return vips


def make_row(start: str, end: str, activity: str) -> dict:
    return {
        "time": f"{start}-{end}",
        "dur": f"{duration_minutes(start, end)}m",
        "activity": activity,
        "loc": "",
        "role": "",
        "status": "pending",
    }


def normalize_time(value: str) -> str:
    hour, minute = value.replace(".", ":").split(":")
    return f"{int(hour):02d}:{int(minute):02d}"


def add_minutes(value: str, minutes: int) -> str:
    hour, minute = [int(part) for part in value.split(":")]
    total = hour * 60 + minute + minutes
    return f"{(total // 60) % 24:02d}:{total % 60:02d}"


def split_time_range(value: str) -> tuple[str, str]:
    start, end = value.split("-", 1)
    return start.strip(), end.strip()


def duration_minutes(start: str, end: str) -> int:
    start_hour, start_minute = [int(part) for part in start.split(":")]
    end_hour, end_minute = [int(part) for part in end.split(":")]
    start_total = start_hour * 60 + start_minute
    end_total = end_hour * 60 + end_minute
    if end_total < start_total:
        end_total += 24 * 60
    return max(1, end_total - start_total)


def clean_activity(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value)
    cleaned = cleaned.strip(" \t:-–—|•")
    return cleaned[:250]


def likely_agenda_line(value: str) -> bool:
    text = value.lower()
    agenda_words = [
        "arrival", "ketibaan", "registration", "pendaftaran", "speech", "ucapan",
        "opening", "perasmian", "break", "rehat", "lunch", "makan", "dinner",
        "photo", "bergambar", "departure", "bersurai", "doa", "performance",
        "session", "majlis", "ceremony",
    ]
    return any(word in text for word in agenda_words)


def classify_activity(activity: str) -> str:
    text = activity.lower()
    if any(word in text for word in ["break", "rehat", "lunch", "dinner", "makan"]):
        return "break"
    if any(word in text for word in ["speech", "ucapan", "address", "keynote"]):
        return "keynote"
    if any(word in text for word in ["panel", "forum"]):
        return "panel"
    if any(word in text for word in ["networking"]):
        return "networking"
    if any(word in text for word in ["arrival", "ketibaan", "opening", "perasmian", "doa", "photo", "departure", "performance", "majlis"]):
        return "ceremony"
    return "session"


def classify_vip(value: str) -> str:
    text = value.lower()
    if "sultan" in text or "dymm" in text or "yam" in text:
        return "royalty"
    if "yab" in text or "vvip" in text or "menteri" in text:
        return "vvip"
    if "yb" in text or "dato" in text or "datuk" in text or "tan sri" in text or "puan sri" in text:
        return "vip"
    return "official"


def infer_event_name(protocol_text: str) -> str:
    for line in protocol_text.splitlines()[:20]:
        cleaned = clean_activity(line)
        if len(cleaned) > 8 and not re.search(r"\b\d{1,2}[:.]\d{2}\b", cleaned):
            return cleaned[:120]
    return "Uploaded Protocol Event"
