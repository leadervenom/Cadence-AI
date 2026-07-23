-- =========================================================
-- MIGRATION: EVENT ASSIGNMENTS
-- File: 09_event_assignments.sql
-- Purpose: formalize a table that already exists in the live dev
-- database (created ad-hoc, not previously tracked in any SQL file)
-- so a fresh database setup reproduces it. Links an app_user to a
-- specific event they're assigned to work on — the basis for
-- role-scoped views later (an Event Organizer only sees/acts on
-- events they're assigned to, etc.).
-- Safe to run against an existing database — purely additive.
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS event_assignments (
    assignment_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    assigned_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, event_id)
);

COMMIT;
