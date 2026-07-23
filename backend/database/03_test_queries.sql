-- =========================================================
-- CADENCE AI ENGINE DATABASE TEST QUERIES
-- File: 03_test_queries.sql
-- Purpose: Check if VIP ranking data is stored properly
-- =========================================================


-- 1. Check current database
SELECT current_database();


-- 2. Count total VIPs in current leaderboard
SELECT COUNT(*) AS total_vips
FROM current_vip_leaderboard;


-- 3. Show full VIP leaderboard
SELECT
    rank_number,
    honorific_title,
    full_name,
    position_title
FROM current_vip_leaderboard
ORDER BY rank_number;


-- 4. Show first 10 highest-ranked VIPs
SELECT
    rank_number,
    honorific_title,
    full_name,
    position_title
FROM current_vip_leaderboard
ORDER BY rank_number
LIMIT 10;


-- 5. Search VIP by name
SELECT
    rank_number,
    honorific_title,
    full_name,
    position_title
FROM current_vip_leaderboard
WHERE full_name ILIKE '%ONN HAFIZ%';


-- 6. Search VIP by position
SELECT
    rank_number,
    honorific_title,
    full_name,
    position_title
FROM current_vip_leaderboard
WHERE position_title ILIKE '%MENTERI BESAR%';


-- 7. Get top 5 highest-ranked VIPs for seating/stage logic
SELECT
    rank_number,
    full_name,
    position_title
FROM current_vip_leaderboard
ORDER BY rank_number
LIMIT 5;


-- 8. Check raw VIP profile table
SELECT
    vip_id,
    full_name,
    honorific_title,
    position_title,
    vip_category,
    is_active
FROM vip_profiles
ORDER BY vip_id;


-- 9. Check raw ranking table
SELECT
    ranking_id,
    vip_id,
    rank_number,
    ranking_scope,
    is_current
FROM vip_rankings
ORDER BY rank_number;