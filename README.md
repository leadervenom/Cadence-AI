# Cadence Engine

AI-powered event operations backend + UI for:
- Running order generation
- VIP seating generation
- Live event updates

The app uses Gemini with strict JSON parsing/validation before returning results.

## Current Project Layout

```text
Claude/
├── main.py                  # FastAPI app (API + static file serving)
├── ai_engine.py             # Gemini wrapper + retry/validation logic
├── desktop.py               # Native desktop launcher (pywebview)
├── index.html               # Main UI
├── app.js                   # Frontend logic + API calls
├── styles.css               # UI styles
├── models.py                # Pydantic schemas
├── routes/
│   ├── running_order_routes.py
│   ├── seating_routes.py
│   └── update_routes.py
├── services/
│   ├── running_order.py
│   └── seating.py
├── example_requests.json
├── example_curl.sh
└── requirements.txt
```

## Requirements

- Python 3.10+
- Gemini API key from Google AI Studio

Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_new_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

Notes:
- `GEMINI_API_KEY` is required.
- If `GEMINI_MODEL` is omitted, default is `gemini-2.5-flash-lite`.

## Run Modes

### 1. Browser mode (FastAPI + web UI)

```bash
uvicorn main:app --reload
```

Open:
- `http://127.0.0.1:8000` (UI)
- `http://127.0.0.1:8000/docs` (Swagger)
- `http://127.0.0.1:8000/health` (health/model check)

### 2. Desktop mode (native window)

```bash
python desktop.py
```

This starts the same FastAPI app locally and opens it in a desktop window.
Use the top-right `Quit` button to close the window and shut down the local server cleanly.

## API Endpoints

- `POST /generate-running-order`
- `POST /generate-seating`
- `POST /update-event`
- `GET /health`

Response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "retries_used": 0
}
```

## Troubleshooting

- `403 PERMISSION_DENIED` with leaked key message:
  - Your API key was disabled by Google.
  - Generate a new key and replace `GEMINI_API_KEY` in `.env`.

- UI shows offline in desktop mode:
  - Ensure you are on latest code (`app.js` uses same-origin API base).
  - Restart `python desktop.py`.

- Server runs but generation fails:
  - Check `.env` key/model.
  - Check terminal logs for Gemini validation/API errors.
