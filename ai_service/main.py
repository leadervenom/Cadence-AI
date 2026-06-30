import os
import base64
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .gemini_client import generate_content, get_default_model
from .protocol_parser import extract_protocol_text
from .structured_engine import (
    generate_event_data_from_protocol,
    generate_running_order_from_protocol,
    running_order_to_frontend_rows,
    vips_to_frontend_rows,
)


load_dotenv()

app = FastAPI(title="Cadence AI Gemini Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    systemPrompt: str = ""
    message: str = ""
    messages: list[ChatMessage] = []
    event: dict[str, Any] | None = None
    model: str = get_default_model()


class ProtocolFileRequest(BaseModel):
    filename: str
    content_base64: str
    model: str = get_default_model()


def build_prompt(payload: ChatRequest) -> str:
    parts = [
        "You are Cadence AI, the built-in event operations assistant for this Cadence application.",
        "Your job is to help generate and reason about running orders, VIP/guest lists, seating, traffic, protocol, and uploaded event documents.",
        "Never claim you cannot read uploaded files when parsed document text or event context is provided in this prompt.",
        "Never answer as a different app, brand, generic assistant, or unrelated product.",
    ]
    if payload.systemPrompt:
        parts.append(f"System instructions:\n{payload.systemPrompt}")
    if payload.event:
        parts.append(f"Event context:\n{payload.event}")
    if payload.messages:
        transcript = "\n".join(
            f"{message.role.upper()}: {message.content}" for message in payload.messages
        )
        parts.append(f"Conversation:\n{transcript}")
    elif payload.message:
        parts.append(f"USER: {payload.message}")
    parts.append(
        "Reply as Cadence AI. Be concise, operational, and accurate. "
        "If parsed uploaded document text is included in the context, treat it as readable source material and use it to answer, summarize, or generate event outputs."
    )
    return "\n\n".join(parts)


def decode_protocol_file(payload: ProtocolFileRequest) -> bytes:
    try:
        return base64.b64decode(payload.content_base64)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid base64 file content")


@app.get("/health")
def health():
    return {"status": "ok", "provider": "gemini"}


@app.post("/chat")
def chat(payload: ChatRequest):
    return {"reply": generate_content(payload.model, build_prompt(payload))}


@app.post("/protocol/parse")
def parse_protocol(payload: ProtocolFileRequest):
    try:
        text = extract_protocol_text(payload.filename, decode_protocol_file(payload))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    return {
        "filename": payload.filename,
        "text": text,
        "characters": len(text),
    }


@app.post("/protocol/running-order")
def protocol_running_order(payload: ProtocolFileRequest):
    try:
        text = extract_protocol_text(payload.filename, decode_protocol_file(payload))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    order, retries = generate_running_order_from_protocol(text)
    return {
        "filename": payload.filename,
        "text": text,
        "running_order": running_order_to_frontend_rows(order),
        "structured": order.model_dump(),
        "retries_used": retries,
    }


@app.post("/protocol/extract")
def protocol_extract(payload: ProtocolFileRequest):
    try:
        text = extract_protocol_text(payload.filename, decode_protocol_file(payload))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    extraction, retries = generate_event_data_from_protocol(text)
    return {
        "filename": payload.filename,
        "text": text,
        "running_order": running_order_to_frontend_rows(extraction.running_order),
        "vips": vips_to_frontend_rows(extraction),
        "structured": extraction.model_dump(),
        "retries_used": retries,
    }


@app.post("/generate-seating")
def generate_seating(data: dict[str, Any]):
    return {
        "result": generate_content(
            data.get("modelName", get_default_model()),
            f"Generate a practical seating arrangement for this event:\n{data}",
        )
    }


@app.post("/generate-running-order")
def generate_running_order(data: dict[str, Any]):
    return {
        "result": generate_content(
            data.get("modelName", get_default_model()),
            f"Generate a running order for this event:\n{data}",
        )
    }


@app.post("/suggest-traffic-flow")
def suggest_traffic_flow(data: dict[str, Any]):
    return {
        "result": generate_content(
            data.get("modelName", get_default_model()),
            f"Suggest traffic flow and convoy timing for this event:\n{data}",
        )
    }
