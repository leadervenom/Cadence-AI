"""
Cadence Engine - Seating Routes
"""

from fastapi import APIRouter, HTTPException
from models import SeatingRequest, CadenceResponse
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
