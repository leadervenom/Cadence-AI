-- =========================================================
-- MIGRATION: SEATING LAYOUTS (MULTIPLE PER VENUE)
-- File: 10_seating_layouts.sql
-- Purpose: the 'seating' section used to hold a single arrangement
-- ({"rows":[...]}). The Layouts tab now needs to hold more than one
-- named layout for the same venue (e.g. "Banquet Seating", "Theatre
-- Seating"), so 'seating' becomes {"layouts":[{id,name,rows}],
-- "activeLayoutId"}. Wraps any existing single arrangement into the
-- first layout, named 'Main Layout', so no existing data is lost.
-- Safe to re-run: only touches events still on the old {"rows":[...]}
-- shape (has 'rows', missing 'layouts').
-- =========================================================

BEGIN;

UPDATE events
SET event_data = jsonb_set(
    event_data,
    '{seating}',
    jsonb_build_object(
        'layouts', jsonb_build_array(
            jsonb_build_object(
                'id', 'layout-1',
                'name', 'Main Layout',
                'rows', COALESCE(event_data->'seating'->'rows', '[]'::jsonb)
            )
        ),
        'activeLayoutId', 'layout-1'
    )
)
WHERE event_data->'seating' ? 'rows'
  AND NOT (event_data->'seating' ? 'layouts');

COMMIT;
