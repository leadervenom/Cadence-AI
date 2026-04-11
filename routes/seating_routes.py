"""
Cadence Engine - Seating Routes
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from models import (
    CadenceResponse,
    Guest,
    SeatingRequest,
    SimpleSeatingRequest,
    Table,
)
from services.seating import generate_seating

router = APIRouter(prefix="/generate-seating", tags=["Seating"])


@router.post("", response_model=CadenceResponse)
async def create_seating(request: SeatingRequest):
    """
    Generate a VIP-hierarchy-respecting seating layout.
    """
    try:
        layout, retries = generate_seating(request)
        return CadenceResponse(
            success=True,
            data=layout.model_dump(),
            retries_used=retries,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


@router.post("/simple", response_model=CadenceResponse)
async def create_seating_simple(request: SimpleSeatingRequest):
    """
    Simple, non-technical seating endpoint:
    only name/role/vip_level inputs from user.
    """
    try:
        if not request.guests:
            raise HTTPException(status_code=400, detail="At least one guest is required.")

        zone_cycle = ["head", "front", "middle", "rear", "side"]
        tables = [
            Table(
                table_id=f"T{idx + 1:02d}",
                table_number=idx + 1,
                capacity=request.table_capacity,
                zone=zone_cycle[min(idx, len(zone_cycle) - 1)],
                accessibility=False,
            )
            for idx in range(request.table_count)
        ]

        guests: list[Guest] = []
        for idx, guest in enumerate(request.guests, start=1):
            guests.append(
                Guest(
                    id=f"G{idx:03d}",
                    name=guest.name,
                    title=guest.role.replace("_", " ").title(),
                    organization="N/A",
                    vip_level=guest.vip_level,
                    rank=idx,
                    role=guest.role,
                    dietary=[],
                    seating_constraints=[],
                    accessibility=False,
                )
            )

        event_id = f"EVT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        seating_request = SeatingRequest(
            event_id=event_id,
            guests=guests,
            tables=tables,
            head_table_guest_ids=[],
        )

        layout, retries = generate_seating(seating_request)
        rows = [
            {
                "name": seat.guest_name,
                "role": next(
                    (guest.role.replace("_", " ") for guest in guests if guest.id == seat.guest_id),
                    "guest",
                ),
                "vip_level": seat.vip_level,
                "table_number": seat.table_number,
                "seat_number": seat.seat_number,
                "zone": seat.zone,
                "notes": seat.notes,
            }
            for seat in layout.layout
        ]

        return CadenceResponse(
            success=True,
            data={
                "event_name": request.event_name,
                "total_guests": layout.total_guests,
                "total_tables": layout.total_tables,
                "assignments": rows,
                "warnings": layout.warnings or [],
            },
            retries_used=retries,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
