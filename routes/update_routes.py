"""
Cadence Engine - Real-Time Update Routes
"""

from fastapi import APIRouter, HTTPException
from models import UpdateRequest, CadenceResponse
from ai_engine import call_gemini, build_update_prompt
from datetime import datetime

router = APIRouter(prefix="/update-event", tags=["Real-Time Updates"])


@router.post("", response_model=CadenceResponse)
async def update_event(request: UpdateRequest):
    """
    Apply real-time updates (delays, cancellations, VIP changes) to a live event.
    Recomputes only affected parts of the running order and seating layout.
    """
    try:
        update_data = request.model_dump()
        prompt = build_update_prompt(update_data)

        raw, retries = call_gemini(prompt)

        # Inject generated_at into nested objects if missing
        if raw.get("running_order") and not raw["running_order"].get("generated_at"):
            raw["running_order"]["generated_at"] = datetime.utcnow().isoformat()
        if raw.get("seating_layout") and not raw["seating_layout"].get("generated_at"):
            raw["seating_layout"]["generated_at"] = datetime.utcnow().isoformat()

        return CadenceResponse(
            success=True,
            data=raw,
            retries_used=retries,
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
