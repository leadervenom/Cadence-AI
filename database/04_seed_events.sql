-- =========================================================
-- CADENCE AI ENGINE EVENT SEED
-- Creates working events with document and extraction records.
-- Run after 01_schema.sql and 02_seed_kekananan.sql.
-- =========================================================

BEGIN;

INSERT INTO events (
    event_name,
    event_type,
    event_date,
    start_time,
    end_time,
    venue_name,
    district,
    status
)
VALUES
(
    'Majlis Santapan Diraja Johor',
    'Annual Royal Banquet - State Protocol Grade I',
    '2026-06-15',
    '18:00',
    '21:00',
    'Istana Besar',
    'Johor Bahru',
    'published'
),
(
    'Hari Keputeraan Sultan Ibrahim',
    'Royal Birthday Parade and Public Address Ceremony',
    '2026-06-22',
    '08:00',
    '11:00',
    'Dataran Bandaraya JB',
    'Johor Bahru',
    'draft'
);

INSERT INTO event_documents (
    event_id,
    file_name,
    file_type,
    document_category,
    storage_path,
    extracted_text,
    extraction_status
)
SELECT
    e.event_id,
    'Protocol_Brief_2026.pdf',
    'pdf',
    'atur_cara',
    '2.4 MB',
    'Royal banquet protocol brief, VIP arrival sequence, seating priorities, and convoy timing.',
    'extracted'
FROM events e
WHERE e.event_name = 'Majlis Santapan Diraja Johor';

INSERT INTO event_documents (
    event_id,
    file_name,
    file_type,
    document_category,
    storage_path,
    extracted_text,
    extraction_status
)
SELECT
    e.event_id,
    'Birthday_Parade_Brief.pdf',
    'pdf',
    'atur_cara',
    '820 KB',
    'Royal birthday parade brief with guard of honour timing and public assembly plan.',
    'extracted'
FROM events e
WHERE e.event_name = 'Hari Keputeraan Sultan Ibrahim';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data, validation_status)
SELECT e.event_id, 'running_order', '[
  {"time":"18:00-18:15","dur":"15m","activity":"Guest Assembly and Registration","loc":"Main Foyer","role":"Ground Usher / Reception","status":"passed"},
  {"time":"18:15-18:30","dur":"15m","activity":"VIP Arrival and Escort to Hall","loc":"South Portico","role":"Protocol Officer","status":"passed"},
  {"time":"18:30-18:45","dur":"15m","activity":"DYMM Sultan Arrival - State Honours","loc":"Grand Entrance","role":"Protocol Officer and VVIP Escort","status":"on-air"},
  {"time":"18:45-19:00","dur":"15m","activity":"Recitation of Doa","loc":"Main Dewan","role":"Emcee / Religious Affairs","status":"next"},
  {"time":"19:00-19:30","dur":"30m","activity":"Royal Address","loc":"Main Dewan","role":"Stage Manager / Teleprompter","status":"pending"},
  {"time":"19:30-21:00","dur":"90m","activity":"State Banquet Dinner","loc":"Main Dewan","role":"All Protocol Officers","status":"pending"}
]'::jsonb, 'published'
FROM events e
WHERE e.event_name = 'Majlis Santapan Diraja Johor';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data, validation_status)
SELECT e.event_id, 'seating_layout', '{
  "rows":[
    [{"label":"DYMM\nSultan","cat":"royalty"},{"label":"Raja\nPermaisuri","cat":"royalty"},{"label":"Tengku\nMahkota","cat":"royalty"}],
    [{"label":"Menteri\nBesar","cat":"vvip"},{"label":"YB\nDatuk","cat":"vip"},{"label":"","cat":"empty"},{"label":"Tan Sri\nRazali","cat":"vip"}]
  ]
}'::jsonb, 'published'
FROM events e
WHERE e.event_name = 'Majlis Santapan Diraja Johor';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data, validation_status)
SELECT e.event_id, 'traffic_flow', '{
  "route":["Istana Bukit Serene","Jalan Skudai","Jalan Air Molek","Istana Besar"],
  "eta_mins":22,
  "distance":"14.3 km",
  "convoy_size":7
}'::jsonb, 'published'
FROM events e
WHERE e.event_name = 'Majlis Santapan Diraja Johor';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data, validation_status)
SELECT e.event_id, 'full_event_snapshot', '{
  "ai_context":"You are Cadence AI for Majlis Santapan Diraja Johor, a live royal state banquet at Istana Besar. Assist with protocol, timing adjustments, VIP arrangements, seating, traffic, and emergency decisions."
}'::jsonb, 'published'
FROM events e
WHERE e.event_name = 'Majlis Santapan Diraja Johor';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data)
SELECT e.event_id, 'running_order', '[
  {"time":"08:00-08:30","dur":"30m","activity":"Guard of Honour Assembly","loc":"Dataran Bandaraya","role":"Military Protocol","status":"pending"},
  {"time":"08:30-09:00","dur":"30m","activity":"Public Assembly and Seating","loc":"Grandstand","role":"Ushers / Ground Team","status":"pending"},
  {"time":"09:00-09:15","dur":"15m","activity":"Royal Procession","loc":"Main Road","role":"Protocol Officer","status":"pending"}
]'::jsonb
FROM events e
WHERE e.event_name = 'Hari Keputeraan Sultan Ibrahim';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data)
SELECT e.event_id, 'seating_layout', '{"rows":[]}'::jsonb
FROM events e
WHERE e.event_name = 'Hari Keputeraan Sultan Ibrahim';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data)
SELECT e.event_id, 'traffic_flow', '{
  "route":["Istana Bukit Serene","Jalan Tun Abdul Razak","Dataran Bandaraya JB"],
  "eta_mins":18,
  "distance":"9.2 km",
  "convoy_size":11
}'::jsonb
FROM events e
WHERE e.event_name = 'Hari Keputeraan Sultan Ibrahim';

INSERT INTO event_extractions (event_id, extraction_type, extracted_data)
SELECT e.event_id, 'full_event_snapshot', '{
  "ai_context":"You are Cadence AI for Hari Keputeraan Sultan Ibrahim. Help with parade logistics, VIP protocol, guard of honour arrangements, and ceremony scheduling."
}'::jsonb
FROM events e
WHERE e.event_name = 'Hari Keputeraan Sultan Ibrahim';

INSERT INTO event_vips (event_id, vip_id, event_rank_override, attendance_status)
SELECT e.event_id, vp.vip_id, vr.rank_number, 'confirmed'
FROM events e
CROSS JOIN vip_profiles vp
JOIN vip_rankings vr ON vr.vip_id = vp.vip_id AND vr.is_current = TRUE
WHERE e.event_name IN ('Majlis Santapan Diraja Johor', 'Hari Keputeraan Sultan Ibrahim')
  AND vr.rank_number <= 3;

COMMIT;
