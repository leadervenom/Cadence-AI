"""
In-memory server state for AI-first workflow.
"""

from __future__ import annotations

from threading import Lock

from models import RunningOrder

_lock = Lock()
_current_running_order: RunningOrder | None = None


def get_current_running_order() -> RunningOrder | None:
    with _lock:
        return _current_running_order


def set_current_running_order(order: RunningOrder) -> None:
    with _lock:
        global _current_running_order
        _current_running_order = order

