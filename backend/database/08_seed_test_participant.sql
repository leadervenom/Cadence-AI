-- =========================================================
-- SEED: TEST PARTICIPANT (for local RSVP testing)
-- File: 08_seed_test_participant.sql
-- Purpose: a real-email test person to invite through the RSVP tab
-- during local development, so the accept/decline email loop can be
-- tested end-to-end. Safe to re-run: skips if already present.
-- =========================================================

INSERT INTO vip_profiles (full_name, honorific_title, position_title, vip_category, email)
SELECT 'Test Participant (RSVP Demo)', NULL, 'Local RSVP Tester', 'guest', 'captainsv3@gmail.com'
WHERE NOT EXISTS (
    SELECT 1 FROM vip_profiles WHERE email = 'captainsv3@gmail.com'
);
