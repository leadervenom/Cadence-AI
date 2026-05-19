"""
Cadence Engine - Running Order Routes
"""

from fastapi import APIRouter, HTTPException
from models import RunningOrderRequest, CadenceResponse, RunningOrder
from services.running_order import generate_running_order

router = APIRouter(prefix="/generate-running-order", tags=["Running Order"])


@router.post("", response_model=CadenceResponse)
async def create_running_order(request: RunningOrderRequest):
    """
    Generate an optimized event running order from speakers, slots, and constraints.
    """
    try:
        order, retries = generate_running_order(request)
        return CadenceResponse(
            success=True,
            data=order.model_dump(),
            retries_used=retries,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
