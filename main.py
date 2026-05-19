"""
Cadence Engine - Main FastAPI Application
A controlled AI backend for professional event management.
"""

import logging
import os
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

# Ensure the project root is always on the path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("cadence")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        logger.error("GEMINI_API_KEY is NOT set. All AI calls will fail.")
    else:
        logger.info("Cadence Engine started. Gemini API key loaded.")
    yield
    logger.info("Cadence Engine shutting down.")


app = FastAPI(
    title="Cadence Engine",
    description=(
        "AI-powered event management backend. "
        "Generates running orders, seating layouts, and handles real-time updates. "
        "Powered by Gemini with strict JSON-only output control."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes.running_order_routes import router as running_order_router
from routes.seating_routes import router as seating_router
from routes.protocol_routes import router as protocol_router
from routes.update_routes import router as update_router

app.include_router(running_order_router)
app.include_router(seating_router)
app.include_router(protocol_router)
app.include_router(update_router)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return FileResponse(os.path.join(os.path.dirname(__file__), "index.html"))


@app.get("/app.js", include_in_schema=False)
async def app_js():
    return FileResponse(
        os.path.join(os.path.dirname(__file__), "app.js"),
        media_type="application/javascript",
    )


@app.get("/styles.css", include_in_schema=False)
async def styles_css():
    return FileResponse(
        os.path.join(os.path.dirname(__file__), "styles.css"),
        media_type="text/css",
    )


@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "engine": "Cadence Engine v1.0.0",
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "data": None, "retries_used": 0},
    )
