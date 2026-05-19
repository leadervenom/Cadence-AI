"""
Cadence Engine - Pydantic Data Models
All schemas for events, agenda, seating, and updates.
"""

from __future__ import annotations
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ValidationInfo, field_validator
from datetime import datetime


# ─── Event Core ───────────────────────────────────────────────────────────────

class Speaker(BaseModel):
    id: str
    name: str
    title: str
    organization: str
    duration_minutes: int
    requirements: Optional[List[str]] = []  # e.g. ["projector", "podium"]


class TimeSlot(BaseModel):
    start: str  # "HH:MM" 24h format
    end: str
    label: Optional[str] = None


class EventConstraint(BaseModel):
    type: Literal["gap_after", "no_parallel", "must_precede", "must_follow", "fixed_time"]
    target_id: str
    reference_id: Optional[str] = None
    value: Optional[int] = None  # minutes for gaps


class Event(BaseModel):
    id: str
    name: str
    date: str  # "YYYY-MM-DD"
    venue: str
    start_time: str  # "HH:MM"
    end_time: str
    speakers: List[Speaker] = []
    constraints: List[EventConstraint] = []
    breaks: Optional[List[TimeSlot]] = []


# ─── Agenda / Running Order ────────────────────────────────────────────────────

class AgendaItem(BaseModel):
    sequence: int
    item_id: str
    title: str
    type: Literal["session", "break", "keynote", "panel", "ceremony", "networking", "other"]
    start_time: str
    end_time: str
    duration_minutes: int
    speaker_id: Optional[str] = None
    speaker_name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Literal["scheduled", "delayed", "cancelled", "completed"] = "scheduled"

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value):
        if value is None:
            return "other"

        text = str(value).strip().lower().replace("-", "_").replace(" ", "_")
        allowed = {"session", "break", "keynote", "panel", "ceremony", "networking", "other"}
        alias_map = {
            "performance": "ceremony",
            "performances": "ceremony",
            "entertainment": "ceremony",
            "intermission": "break",
            "networking_session": "networking",
        }

        if text in allowed:
            return text
        if text in alias_map:
            return alias_map[text]
        return "other"

    @field_validator("duration_minutes", mode="before")
    @classmethod
    def normalize_duration_minutes(cls, value, info: ValidationInfo):
        if isinstance(value, int):
            return value

        if isinstance(value, str):
            stripped = value.strip()
            if stripped.isdigit():
                return int(stripped)

        if value is None:
            start_time = info.data.get("start_time")
            end_time = info.data.get("end_time")
            inferred = cls._infer_duration_minutes(start_time, end_time)
            if inferred is not None:
                return inferred

        raise ValueError("duration_minutes must be an integer or inferable from start_time/end_time")

    @staticmethod
    def _infer_duration_minutes(start_time: Optional[str], end_time: Optional[str]) -> Optional[int]:
        if not start_time or not end_time:
            return None

        start = AgendaItem._hhmm_to_minutes(start_time)
        end = AgendaItem._hhmm_to_minutes(end_time)
        if start is None or end is None:
            return None

        if end < start:
            end += 24 * 60

        return end - start

    @staticmethod
    def _hhmm_to_minutes(value: str) -> Optional[int]:
        parts = value.split(":")
        if len(parts) != 2:
            return None
        if not parts[0].isdigit() or not parts[1].isdigit():
            return None

        hour = int(parts[0])
        minute = int(parts[1])
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            return None

        return hour * 60 + minute


class RunningOrder(BaseModel):
    event_id: str
    event_name: str
    generated_at: str
    total_duration_minutes: int
    items: List[AgendaItem]
    warnings: Optional[List[str]] = []


# ─── Seating ──────────────────────────────────────────────────────────────────

class Guest(BaseModel):
    id: str
    name: str
    title: str
    organization: str
    vip_level: Literal[0, 1, 2, 3, 4, 5]  # 5 = highest
    rank: int  # lower = higher precedence
    role: Literal["keynote_speaker", "vip_guest", "sponsor", "official", "delegate", "staff", "general"]
    dietary: Optional[List[str]] = []
    seating_constraints: Optional[List[str]] = []  # e.g. ["near_exit", "away_from:G002"]
    accessibility: Optional[bool] = False


class Table(BaseModel):
    table_id: str
    table_number: int
    capacity: int
    zone: Literal["head", "front", "middle", "rear", "side"]
    accessibility: bool = False


class SeatingPosition(BaseModel):
    guest_id: str
    guest_name: str
    guest_title: str
    table_id: str
    table_number: int
    seat_number: int
    zone: str
    vip_level: int
    notes: Optional[str] = None


class SeatingLayout(BaseModel):
    event_id: str
    generated_at: str
    total_guests: int
    total_tables: int
    layout: List[SeatingPosition]
    unassigned: Optional[List[str]] = []  # guest IDs that couldn't be placed
    warnings: Optional[List[str]] = []


# ─── Requests ─────────────────────────────────────────────────────────────────

class RunningOrderRequest(BaseModel):
    event: Event


class SeatingRequest(BaseModel):
    event_id: str
    guests: List[Guest]
    tables: List[Table]
    head_table_guest_ids: Optional[List[str]] = []  # forced head table


class UpdateType(BaseModel):
    type: Literal["delay", "cancellation", "vip_arrival", "vip_removal", "venue_change", "time_change"]
    target_id: str  # item_id or guest_id
    delta_minutes: Optional[int] = None       # for delays
    new_value: Optional[str] = None           # for venue/time changes
    reason: Optional[str] = None


class UpdateRequest(BaseModel):
    event_id: str
    current_running_order: Optional[RunningOrder] = None
    current_seating: Optional[SeatingLayout] = None
    updates: List[UpdateType]


class RunningOrderEditRequest(BaseModel):
    instruction: str = Field(min_length=3, max_length=1000)


class SimpleGuestInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: Literal[
        "keynote_speaker",
        "vip_guest",
        "sponsor",
        "official",
        "delegate",
        "staff",
        "general",
    ]
    vip_level: Literal[0, 1, 2, 3, 4, 5]


class SimpleSeatingRequest(BaseModel):
    event_name: Optional[str] = "Cadence Event"
    guests: List[SimpleGuestInput]
    table_count: int = Field(default=8, ge=1, le=100)
    table_capacity: int = Field(default=8, ge=1, le=20)


# ─── Response Wrappers ────────────────────────────────────────────────────────

class CadenceResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    retries_used: int = 0
