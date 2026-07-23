-- =========================================================
-- MIGRATION: REMOVE TRAFFIC SECTION
-- File: 06_remove_traffic_section.sql
-- Purpose: the traffic/motorcade feature has been removed from the app
-- (README's "to be removed" list). Strip the now-dead 'traffic' key out
-- of existing events.event_data JSONB blobs so no stale data lingers.
-- Does not touch event_extractions — 'traffic_flow' rows there remain
-- valid historical audit records, and 'traffic_flow' stays a valid
-- event_documents.document_category (unrelated document classification).
-- Safe to re-run: removing an absent key is a no-op.
-- =========================================================

BEGIN;

UPDATE events
SET event_data = event_data - 'traffic'
WHERE event_data ? 'traffic';

COMMIT;
