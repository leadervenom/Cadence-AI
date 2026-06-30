from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ValidationInfo, field_validator


class AgendaItem(BaseModel):
    sequence: int
    item_id: str
    title: str
    type: Literal["session", "break", "keynote", "panel", "ceremony", "networking", "other"]
    start_time: str
    end_time: str
    duration_minutes: int
    speaker_id: str | None = None
    speaker_name: str | None = None
    location: str | None = None
    notes: str | None = None
    status: Literal["scheduled", "delayed", "cancelled", "completed"] = "scheduled"

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value):
        text = str(value or "other").strip().lower().replace("-", "_").replace(" ", "_")
        allowed = {"session", "break", "keynote", "panel", "ceremony", "networking", "other"}
        aliases = {
            "performance": "ceremony",
            "performances": "ceremony",
            "arrival": "ceremony",
            "departure": "ceremony",
            "prayer": "ceremony",
            "meal": "ceremony",
            "speech": "keynote",
            "address": "keynote",
        }
        if text in allowed:
            return text
        return aliases.get(text, "other")

    @field_validator("duration_minutes", mode="before")
    @classmethod
    def normalize_duration_minutes(cls, value, info: ValidationInfo):
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.strip().isdigit():
            return int(value.strip())
        if value is None:
            inferred = cls._infer_duration_minutes(
                info.data.get("start_time"),
                info.data.get("end_time"),
            )
            if inferred is not None:
                return inferred
        raise ValueError("duration_minutes must be an integer")

    @staticmethod
    def _infer_duration_minutes(start_time: str | None, end_time: str | None) -> int | None:
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
    def _hhmm_to_minutes(value: str) -> int | None:
        parts = value.split(":")
        if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit():
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
    items: list[AgendaItem]
    warnings: list[str] = []


class ExtractedVip(BaseModel):
    name: str
    title: str = ""
    category: Literal["royalty", "vvip", "vip", "official", "guest"] = "guest"
    rank: int
    status: Literal["invited", "confirmed", "declined", "absent", "arrived", "attended"] = "invited"

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, value):
        text = str(value or "guest").strip().lower()
        if text in {"royal", "royalty"}:
            return "royalty"
        if text in {"vvip", "v_vip"}:
            return "vvip"
        if text in {"vip", "official", "guest"}:
            return text
        return "guest"


class ProtocolExtraction(BaseModel):
    running_order: RunningOrder
    vips: list[ExtractedVip] = []
    warnings: list[str] = []
