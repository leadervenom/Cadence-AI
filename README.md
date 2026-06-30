# Cadence AI

Cadence AI is a Vue + Express + PostgreSQL event operations workspace with a FastAPI Gemini service for AI chat.

## Stack

- Frontend: Vue 3 + Vite
- Backend API: Express + PostgreSQL
- AI service: FastAPI + Gemini
- Database: PostgreSQL schema and seed SQL in `database/`

## Setup

Create a `.env` file in the project root:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cadence_ai
DB_USER=postgres
DB_PASSWORD=postgres
GEMINI_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Create `frontend/.env` if you need a custom backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Install dependencies:

```bash
npm install
cd frontend
npm install
cd ..
pip install -r requirements.txt
```

Create and seed the database:

```bash
createdb cadence_ai
npm run db:init
```

Run the services in three terminals:

```bash
npm run ai
```

```bash
npm run dev
```

```bash
cd frontend
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## What Is Connected

- Event list loads from `GET /api/events`.
- Creating an event writes to the `events` table and creates initial extraction records.
- Opening an event loads documents, VIPs, running order, seating, traffic, and AI context from PostgreSQL.
- Uploading files stores document metadata and readable text in `event_documents`.
- PDF, DOCX, and TXT uploads are parsed server-side by FastAPI using the restored protocol parser.
- Protocol uploads can generate a structured running order through Gemini and save it to `event_extractions`.
- AI chat calls Vue -> Express `/api/ai/chat` -> FastAPI `/chat` -> Gemini.
- Browser-exposed AI provider keys have been removed.

## API Highlights

- `GET /api/health`
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/:eventId`
- `POST /api/events/:eventId/documents`
- `PUT /api/events/:eventId/extractions/:type`
- `PUT /api/events/:eventId/vips`
- `GET /api/ai`
- `POST /api/ai/chat`
- `POST /api/ai/protocol/parse`
- `POST /api/ai/protocol/running-order`

## Notes

The frontend falls back to local seed data if the Express API is unavailable, but any real edits require PostgreSQL and the backend to be running.
