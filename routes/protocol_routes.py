"""
Cadence Engine - AI-first protocol upload and running-order editing routes.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile

from ai_engine import (
    build_protocol_running_order_prompt,
    build_running_order_edit_prompt,
    call_gemini,
)
from models import CadenceResponse, RunningOrder, RunningOrderEditRequest
from services.protocol_parser import SUPPORTED_PROTOCOL_EXTENSIONS, extract_protocol_text
from services.state_store import get_current_running_order, set_current_running_order

router = APIRouter(tags=["AI Workflow"])


@router.post("/upload-protocol", response_model=CadenceResponse)
async def upload_protocol(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing filename.")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        protocol_text = extract_protocol_text(file.filename, content)
        if len(protocol_text) > 40000:
            protocol_text = protocol_text[:40000]

        prompt = build_protocol_running_order_prompt(protocol_text)
        raw, retries = call_gemini(prompt, response_model=RunningOrder)

        if not raw.get("generated_at"):
            raw["generated_at"] = datetime.utcnow().isoformat()

        order = RunningOrder.model_validate(raw)
        set_current_running_order(order)

        return CadenceResponse(
            success=True,
            data={
                "running_order": order.model_dump(),
                "source_file": file.filename,
                "accepted_file_types": sorted(SUPPORTED_PROTOCOL_EXTENSIONS),
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


@router.post("/edit-running-order", response_model=CadenceResponse)
async def edit_running_order(request: RunningOrderEditRequest):
    try:
        current = get_current_running_order()
        if current is None:
            raise HTTPException(
                status_code=400,
                detail="No running order in state. Upload a protocol document first.",
            )

        prompt = build_running_order_edit_prompt(
            current_order=current.model_dump(),
            instruction=request.instruction,
        )
        raw, retries = call_gemini(prompt, response_model=RunningOrder)

        if not raw.get("generated_at"):
            raw["generated_at"] = datetime.utcnow().isoformat()

        updated = RunningOrder.model_validate(raw)
        set_current_running_order(updated)

        return CadenceResponse(
            success=True,
            data={"running_order": updated.model_dump()},
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


@router.get("/running-order/current", response_model=CadenceResponse)
async def current_running_order():
    order = get_current_running_order()
    if order is None:
        return CadenceResponse(success=True, data={"running_order": None}, retries_used=0)
    return CadenceResponse(
        success=True,
        data={"running_order": order.model_dump()},
        retries_used=0,
    )

