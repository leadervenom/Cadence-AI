<<<<<<< HEAD
# Cadence-AI
This Ai helps with the seating arrangement and running order of an event that helps assisting in last minute changes during the event based
=======
# Cadence Engine

> **A controlled AI backend for professional event management.**
> Powered by Gemini with strict JSON-only output. No drift. No hallucinations.

---

## What It Does

| Engine | Endpoint | Purpose |
|--------|----------|---------|
| Running Order | `POST /generate-running-order` | Generates optimized event timelines from speakers, slots, and constraints |
| VIP Seating | `POST /generate-seating` | Arranges guests by VIP level, rank, role, and constraints |
| Live Updates | `POST /update-event` | Applies real-time changes (delays, cancellations, VIP changes) |

---

## Project Structure

```
cadence-engine/
├── main.py                     # FastAPI app + dashboard UI
├── ai_engine.py                # Gemini wrapper (strict JSON enforcement)
├── models.py                   # All Pydantic schemas
├── services/
│   ├── running_order.py        # Running order orchestration
│   └── seating.py              # Seating orchestration
├── routes/
│   ├── running_order_routes.py
│   ├── seating_routes.py
│   └── update_routes.py
├── requirements.txt
├── .env.example
├── example_requests.json       # Full example payloads
├── example_curl.sh             # Quick cURL tests
└── .vscode/
    └── launch.json             # VS Code debug config
```

---

## Setup (VS Code)

### 1. Prerequisites

- Python 3.10+
- A Google AI Studio API key → [Get one here](https://aistudio.google.com/app/apikey)

### 2. Clone / Open the project

Open the `cadence-engine/` folder in VS Code.

### 3. Create a virtual environment

```bash
python -m venv venv
```

Activate it:
- **macOS/Linux:** `source venv/bin/activate`
- **Windows:** `venv\Scripts\activate`

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure your API key

```bash
cp .env.example .env
```

Edit `.env` and set your key:

```
GEMINI_API_KEY=REDACTED_GEMINI_KEY
```

### 6. Run the server

**Option A — Terminal:**
```bash
uvicorn main:app --reload
```

**Option B — VS Code debugger:**
Press `F5` (uses `.vscode/launch.json` automatically).

### 7. Open the dashboard

Visit: **http://localhost:8000**

Interactive API docs: **http://localhost:8000/docs**

---

## API Usage

### Generate a Running Order

```bash
curl -X POST http://localhost:8000/generate-running-order \
  -H "Content-Type: application/json" \
  -d @example_requests.json | python3 -m json.tool
```

Or run all examples at once:
```bash
chmod +x example_curl.sh
./example_curl.sh
```

See `example_requests.json` for full request bodies for all three endpoints.

---

## Response Format

All responses follow this wrapper:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "retries_used": 0
}
```

On AI failure (after 2 retries):

```json
{
  "success": false,
  "data": null,
  "error": "Gemini failed after 3 attempts. Last error: ...",
  "retries_used": 2
}
```

---

## AI Control Layer

The Gemini wrapper (`ai_engine.py`) enforces:

1. **System prompt injection** — Every call includes strict "JSON-only, no explanations" instructions
2. **Markdown stripping** — Removes accidental ` ```json ``` ` fences
3. **JSON parsing** — Hard fails if output is not parseable
4. **Pydantic validation** — Output must match the expected schema exactly
5. **Auto-retry** — Up to 2 retries on parse or schema failure
6. **Structured error** — If all retries fail, returns a clean error response

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | — | Your Google AI Studio API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-preview-04-17` | Gemini model to use |

---

## VIP Seating Hierarchy Rules

- `vip_level` 5 = highest (head table), 0 = general
- `rank` (lower number = higher precedence) breaks ties within the same vip_level
- `role` priority: `official` > `keynote_speaker` > `vip_guest` > `sponsor` > `delegate` > `staff` > `general`
- `accessibility: true` guests are placed at accessibility-enabled tables only
- `seating_constraints` like `"away_from:G002"` prevent two guests from sharing a table
- `head_table_guest_ids` forces specific guests to the head table zone
>>>>>>> 8efdca0 (Initial Commit)
