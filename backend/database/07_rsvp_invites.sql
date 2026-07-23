-- =========================================================
-- MIGRATION: RSVP INVITES
-- File: 07_rsvp_invites.sql
-- Purpose: support the RSVP email feature (README "New features").
-- Each event_vips row (a person invited to a specific event) gets a
-- unique token so the accept/decline links in the invite email can
-- update attendance_status without requiring the recipient to log in.
-- Safe to run against an existing DB — purely additive.
-- =========================================================

BEGIN;

ALTER TABLE event_vips
    ADD COLUMN IF NOT EXISTS rsvp_token VARCHAR(64) UNIQUE;

ALTER TABLE event_vips
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;

ALTER TABLE event_vips
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_event_vips_rsvp_token
ON event_vips(rsvp_token);

COMMIT;
