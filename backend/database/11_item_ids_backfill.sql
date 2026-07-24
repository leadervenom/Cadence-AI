-- =========================================================
-- MIGRATION: BACKFILL ITEM IDS
-- File: 11_item_ids_backfill.sql
-- Purpose: the AI chat can now target a single running_order/vips/
-- sources item (or seating.layouts layout) for update/delete via a
-- stable "id" field. Existing rows predate this and have no "id",
-- so nothing could be targeted. Backfills a deterministic id
-- ('ro-<event_id>-<index>', 'vip-<event_id>-<index>',
-- 'src-<event_id>-<index>') onto every array item that doesn't
-- already have one. seating.layouts already gets ids from
-- 10_seating_layouts.sql, so it's not touched here.
-- Safe to re-run: elements that already have 'id' are left as-is.
-- =========================================================

BEGIN;

UPDATE events e
SET event_data = jsonb_set(
    e.event_data,
    '{running_order}',
    COALESCE((
        SELECT jsonb_agg(
            CASE WHEN elem ? 'id' THEN elem
                 ELSE elem || jsonb_build_object('id', 'ro-' || e.event_id || '-' || (idx - 1))
            END
            ORDER BY idx
        )
        FROM jsonb_array_elements(e.event_data->'running_order') WITH ORDINALITY AS t(elem, idx)
    ), '[]'::jsonb)
)
WHERE jsonb_typeof(e.event_data->'running_order') = 'array';

UPDATE events e
SET event_data = jsonb_set(
    e.event_data,
    '{vips}',
    COALESCE((
        SELECT jsonb_agg(
            CASE WHEN elem ? 'id' THEN elem
                 ELSE elem || jsonb_build_object('id', 'vip-' || e.event_id || '-' || (idx - 1))
            END
            ORDER BY idx
        )
        FROM jsonb_array_elements(e.event_data->'vips') WITH ORDINALITY AS t(elem, idx)
    ), '[]'::jsonb)
)
WHERE jsonb_typeof(e.event_data->'vips') = 'array';

UPDATE events e
SET event_data = jsonb_set(
    e.event_data,
    '{sources}',
    COALESCE((
        SELECT jsonb_agg(
            CASE WHEN elem ? 'id' THEN elem
                 ELSE elem || jsonb_build_object('id', 'src-' || e.event_id || '-' || (idx - 1))
            END
            ORDER BY idx
        )
        FROM jsonb_array_elements(e.event_data->'sources') WITH ORDINALITY AS t(elem, idx)
    ), '[]'::jsonb)
)
WHERE jsonb_typeof(e.event_data->'sources') = 'array';

COMMIT;
