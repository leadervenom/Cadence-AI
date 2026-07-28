-- =========================================================
-- MIGRATION: ORGANIZER INVITES
-- File: 12_organizer_invites.sql
-- Purpose: lets an admin invite an Event Organizer to a specific
-- event by email even when that person has no app_users account
-- yet. On acceptance the invite becomes an event_assignments row
-- (see 09_event_assignments.sql) for the newly created account.
-- Safe to run against an existing database — purely additive.
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS event_organizer_invites (
    invite_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,

    token VARCHAR(64) UNIQUE NOT NULL,

    invited_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'revoked')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_organizer_invites_event
ON event_organizer_invites(event_id);

COMMIT;
