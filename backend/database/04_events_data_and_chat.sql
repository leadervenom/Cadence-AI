-- =========================================================
-- MIGRATION: EVENT DATA + CHAT HISTORY
-- File: 04_events_data_and_chat.sql
-- Purpose:
-- 1. Give events a working JSONB document (running_order, vips,
--    seating, traffic, sources, ai_context) so the AI chat's structured
--    commands persist to Postgres instead of flat files on disk.
-- 2. Support the 'live' event status already used by the frontend.
-- 3. Add a chat_messages table to replace the flat-file chat history.
-- Safe to run against an existing database — purely additive.
-- =========================================================

BEGIN;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS event_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE events
    DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events
    ADD CONSTRAINT events_status_check CHECK (
        status IN (
            'draft',
            'extracting',
            'under_review',
            'live',
            'published',
            'completed',
            'archived'
        )
    );

-- Two independent, not-necessarily-aligned sequences per event:
-- 'messages'     -> what AiChatTab.vue renders (role, pre-rendered HTML)
-- 'chat_history' -> what actually gets sent back to Gemini as context (role, raw text)
-- They can differ in length (e.g. the opening greeting only exists in 'messages'),
-- so this is not a single request/reply table — list_name keeps the two apart.
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    list_name VARCHAR(20) NOT NULL CHECK (
        list_name IN ('messages', 'chat_history')
    ),

    role VARCHAR(20) NOT NULL CHECK (
        role IN ('user', 'assistant')
    ),

    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_event
ON chat_messages(event_id);

COMMIT;
