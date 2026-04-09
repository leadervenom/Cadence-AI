"""
Cadence Engine - Main FastAPI Application
A controlled AI backend for professional event management.
"""

import logging
import os
import sys

# Ensure the project root is always on the path (fixes Windows + VS Code issues)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("cadence")


# ─── App Lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        logger.error("GEMINI_API_KEY is NOT set. All AI calls will fail.")
    else:
        logger.info("Cadence Engine started. Gemini API key loaded.")
    yield
    logger.info("Cadence Engine shutting down.")


# ─── App Init ─────────────────────────────────────────────────────────────────

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


# ─── Routes ───────────────────────────────────────────────────────────────────

from routes.running_order_routes import router as running_order_router
from routes.seating_routes import router as seating_router
from routes.update_routes import router as update_router

app.include_router(running_order_router)
app.include_router(seating_router)
app.include_router(update_router)


# ─── Health & Root ────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return HTMLResponse(content=DASHBOARD_HTML)


@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "engine": "Cadence Engine v1.0.0",
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash-preview-04-17"),
    }


# ─── Global Error Handler ─────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "data": None, "retries_used": 0},
    )


# ─── Minimal Dashboard HTML ───────────────────────────────────────────────────

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cadence Engine</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #09090f;
      --surface: #12121c;
      --border: #1f1f32;
      --accent: #7c6af7;
      --accent2: #f7a26a;
      --text: #e8e6f0;
      --muted: #6b6880;
      --green: #4ade80;
      --red: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; }

    header {
      border-bottom: 1px solid var(--border);
      padding: 28px 48px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-mark {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border-radius: 10px;
      display: grid; place-items: center;
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px;
    }
    h1 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .tagline { color: var(--muted); font-size: 12px; margin-left: auto; }

    main { padding: 48px; max-width: 1100px; margin: 0 auto; }

    .hero { margin-bottom: 48px; }
    .hero h2 { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; }
    .hero h2 span { color: var(--accent); }
    .hero p { color: var(--muted); margin-top: 12px; font-size: 13px; max-width: 520px; line-height: 1.7; }

    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: var(--accent); }
    .card-label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
    .card-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .card-desc { color: var(--muted); font-size: 12px; line-height: 1.6; }
    .pill {
      display: inline-block; margin-top: 14px;
      background: #1a1a2e; border: 1px solid var(--border);
      border-radius: 6px; padding: 4px 10px;
      font-size: 11px; color: var(--accent);
    }

    .endpoints { margin-bottom: 40px; }
    .endpoints h3 { font-family: 'Syne', sans-serif; font-size: 16px; margin-bottom: 16px; }
    .ep {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 16px 20px; margin-bottom: 8px;
      display: flex; align-items: center; gap: 16px;
    }
    .method { font-size: 11px; font-weight: 500; color: var(--accent2); background: #1f1a12; border-radius: 5px; padding: 3px 8px; }
    .path { font-size: 13px; color: var(--text); }
    .ep-desc { color: var(--muted); font-size: 12px; margin-left: auto; }

    .status-bar {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 16px 20px; display: flex; align-items: center; gap: 20px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
    .status-text { font-size: 13px; }
    .links { margin-left: auto; display: flex; gap: 12px; }
    .links a {
      font-size: 12px; color: var(--accent); text-decoration: none;
      border: 1px solid var(--border); border-radius: 6px; padding: 6px 14px;
      transition: background 0.15s;
    }
    .links a:hover { background: var(--border); }
  </style>
</head>
<body>
  <header>
    <div class="logo-mark">C</div>
    <h1>Cadence Engine</h1>
    <span class="tagline">Event AI · v1.0.0</span>
  </header>
  <main>
    <div class="hero">
      <h2>Deterministic AI for<br/><span>Event Management.</span></h2>
      <p>Running orders, VIP seating, and real-time updates — powered by Gemini with strict JSON-only output. No drift. No hallucinations. Just structured results.</p>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">Engine 01</div>
        <div class="card-title">Running Order</div>
        <div class="card-desc">Generates optimized event timelines from speakers, slots, and scheduling constraints.</div>
        <span class="pill">POST /generate-running-order</span>
      </div>
      <div class="card">
        <div class="card-label">Engine 02</div>
        <div class="card-title">VIP Seating</div>
        <div class="card-desc">Arranges guests by VIP level, rank, and role. Respects all hierarchy rules and constraints.</div>
        <span class="pill">POST /generate-seating</span>
      </div>
      <div class="card">
        <div class="card-label">Engine 03</div>
        <div class="card-title">Live Updates</div>
        <div class="card-desc">Handles delays, cancellations, and VIP changes in real-time without full recomputation.</div>
        <span class="pill">POST /update-event</span>
      </div>
    </div>

    <div class="endpoints">
      <h3>API Endpoints</h3>
      <div class="ep">
        <span class="method">POST</span>
        <span class="path">/generate-running-order</span>
        <span class="ep-desc">Generate event agenda from speakers and constraints</span>
      </div>
      <div class="ep">
        <span class="method">POST</span>
        <span class="path">/generate-seating</span>
        <span class="ep-desc">Arrange VIP seating with hierarchy rules</span>
      </div>
      <div class="ep">
        <span class="method">POST</span>
        <span class="path">/update-event</span>
        <span class="ep-desc">Apply real-time updates to live event data</span>
      </div>
      <div class="ep">
        <span class="method">GET</span>
        <span class="path">/health</span>
        <span class="ep-desc">System health and Gemini key status</span>
      </div>
    </div>

    <div class="status-bar">
      <div class="dot"></div>
      <span class="status-text">Engine Online</span>
      <div class="links">
        <a href="/docs">Swagger UI</a>
        <a href="/redoc">ReDoc</a>
        <a href="/health">Health</a>
      </div>
    </div>
  </main>
</body>
</html>"""