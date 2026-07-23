-- =========================================================
-- CADENCE AI ENGINE DATABASE SCHEMA
-- File: 01_schema.sql
-- Purpose:
-- 1. Store permanent VIP details
-- 2. Store official kekananan / ranking leaderboard
-- 3. Store event records
-- 4. Store uploaded documents
-- 5. Store extracted event data as JSON snapshots
-- 6. Support admin approval and audit history
-- =========================================================

BEGIN;

-- =========================================================
-- RESET SECTION
-- Use this only while developing.
-- This deletes old tables/views so you can start clean.
-- =========================================================

DROP VIEW IF EXISTS current_vip_leaderboard CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS event_extractions CASCADE;
DROP TABLE IF EXISTS event_documents CASCADE;
DROP TABLE IF EXISTS event_vips CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS vip_rankings CASCADE;
DROP TABLE IF EXISTS vip_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- =========================================================
-- 1. APP USERS
-- Admin, event organizer, protocol officer, usher, viewer
-- =========================================================

CREATE TABLE app_users (
    user_id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT,

    role VARCHAR(50) NOT NULL CHECK (
        role IN (
            'admin',
            'event_organizer',
            'protocol_officer',
            'usher',
            'viewer'
        )
    ),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. ORGANIZATIONS / AGENCIES
-- Example: SUKJ, MBJB, IRDA, JCORP, UTM, KTMB
-- =========================================================

CREATE TABLE organizations (
    organization_id SERIAL PRIMARY KEY,

    organization_name VARCHAR(200) NOT NULL,
    abbreviation VARCHAR(50),
    organization_type VARCHAR(80),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3. VIP PROFILES
-- Permanent VIP/person details.
-- Rank is NOT stored here because rank can change.
-- =========================================================

CREATE TABLE vip_profiles (
    vip_id SERIAL PRIMARY KEY,

    full_name VARCHAR(250) NOT NULL,
    honorific_title VARCHAR(150),
    position_title VARCHAR(250),

    organization_id INT REFERENCES organizations(organization_id) ON DELETE SET NULL,

    district VARCHAR(100),

    vip_category VARCHAR(50) DEFAULT 'vip' CHECK (
        vip_category IN (
            'royalty',
            'vvip',
            'vip',
            'official',
            'guest'
        )
    ),

    phone VARCHAR(50),
    email VARCHAR(150),

    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 4. VIP RANKINGS / KEKANANAN LEADERBOARD
-- Lower rank_number = higher priority.
-- Example: rank 1 is higher than rank 2.
-- =========================================================

CREATE TABLE vip_rankings (
    ranking_id SERIAL PRIMARY KEY,

    vip_id INT NOT NULL REFERENCES vip_profiles(vip_id) ON DELETE CASCADE,

    rank_number INT NOT NULL,
    ranking_scope VARCHAR(100) DEFAULT 'Johor State',

    source_name VARCHAR(250),

    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,

    is_current BOOLEAN DEFAULT TRUE,

    notes TEXT,

    created_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one active/current person can hold the same rank number
-- within the same ranking scope.
CREATE UNIQUE INDEX unique_current_rank
ON vip_rankings (rank_number, ranking_scope)
WHERE is_current = TRUE;

-- =========================================================
-- 5. EVENTS
-- One record per event.
-- Detailed extracted data is saved in event_extractions.
-- =========================================================

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,

    event_name VARCHAR(250) NOT NULL,
    event_type VARCHAR(100),

    event_date DATE,
    start_time TIME,
    end_time TIME,

    venue_name VARCHAR(250),
    venue_address TEXT,
    district VARCHAR(100),

    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'extracting',
            'under_review',
            'published',
            'completed',
            'archived'
        )
    ),

    created_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 6. EVENT VIPS
-- Links VIP master data to a specific event.
-- This is where attendance, event role, plus-one, arrival time,
-- and event-specific rank override are stored.
-- =========================================================

CREATE TABLE event_vips (
    event_vip_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    vip_id INT NOT NULL REFERENCES vip_profiles(vip_id) ON DELETE CASCADE,

    event_rank_override INT,

    attendance_status VARCHAR(50) DEFAULT 'invited' CHECK (
        attendance_status IN (
            'invited',
            'confirmed',
            'declined',
            'absent',
            'arrived',
            'attended'
        )
    ),

    event_role VARCHAR(150),
    plus_one_name VARCHAR(250),

    arrival_time TIME,
    departure_time TIME,

    special_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (event_id, vip_id)
);

-- =========================================================
-- 7. EVENT DOCUMENTS
-- Stores uploaded PDFs, DOCX, PPTX, images, etc.
-- The actual file can be stored in server storage.
-- This table stores metadata and extraction status.
-- =========================================================

CREATE TABLE event_documents (
    document_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),

    document_category VARCHAR(80) CHECK (
        document_category IN (
            'atur_cara',
            'vip_list',
            'seating_layout',
            'floor_plan',
            'traffic_flow',
            'stage_arrangement',
            'requirements',
            'checklist',
            'other'
        )
    ),

    storage_path TEXT,

    extracted_text TEXT,

    extraction_status VARCHAR(50) DEFAULT 'pending' CHECK (
        extraction_status IN (
            'pending',
            'processing',
            'extracted',
            'failed',
            'verified'
        )
    ),

    uploaded_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 8. EVENT EXTRACTIONS
-- Stores AI/app extracted data.
-- JSONB is used because every event document can have different structure.
-- Example extraction types:
-- running_order, seating_layout, traffic_flow, stage_arrangement.
-- =========================================================

CREATE TABLE event_extractions (
    extraction_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    document_id INT REFERENCES event_documents(document_id) ON DELETE SET NULL,

    extraction_type VARCHAR(80) NOT NULL CHECK (
        extraction_type IN (
            'running_order',
            'vip_list',
            'seating_layout',
            'traffic_flow',
            'stage_arrangement',
            'requirements',
            'committee',
            'full_event_snapshot'
        )
    ),

    extracted_data JSONB NOT NULL,

    confidence_score NUMERIC(5,2),

    validation_status VARCHAR(50) DEFAULT 'draft' CHECK (
        validation_status IN (
            'draft',
            'needs_review',
            'approved',
            'rejected',
            'published'
        )
    ),

    reviewed_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 9. CHANGE REQUESTS
-- Admin/protocol edits can be stored here first before being applied.
-- This prevents random changes from directly affecting the user interface.
-- =========================================================

CREATE TABLE change_requests (
    change_request_id SERIAL PRIMARY KEY,

    requested_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,
    approved_by INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    target_table VARCHAR(100) NOT NULL,
    target_record_id INT,

    change_type VARCHAR(50) CHECK (
        change_type IN (
            'create',
            'update',
            'delete',
            'publish',
            'archive'
        )
    ),

    old_data JSONB,
    new_data JSONB,

    reason TEXT,

    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected',
            'applied'
        )
    ),

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    applied_at TIMESTAMP
);

-- =========================================================
-- 10. AUDIT LOGS
-- Tracks important admin/system changes.
-- =========================================================

CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,

    user_id INT REFERENCES app_users(user_id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,

    details JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 11. VIEW: CURRENT VIP LEADERBOARD
-- Your app should read from this view for official ranking.
-- =========================================================

CREATE VIEW current_vip_leaderboard AS
SELECT
    vr.rank_number,
    vp.vip_id,
    vp.honorific_title,
    vp.full_name,
    vp.position_title,
    o.organization_name,
    o.abbreviation,
    vp.district,
    vp.vip_category,
    vr.ranking_scope,
    vr.effective_from
FROM vip_rankings vr
JOIN vip_profiles vp
    ON vr.vip_id = vp.vip_id
LEFT JOIN organizations o
    ON vp.organization_id = o.organization_id
WHERE vr.is_current = TRUE
  AND vp.is_active = TRUE
ORDER BY vr.rank_number ASC;

-- =========================================================
-- 12. INDEXES
-- Makes search/query faster later.
-- =========================================================

CREATE INDEX idx_app_users_email
ON app_users(email);

CREATE INDEX idx_vip_profiles_name
ON vip_profiles(full_name);

CREATE INDEX idx_vip_profiles_position
ON vip_profiles(position_title);

CREATE INDEX idx_vip_rankings_rank
ON vip_rankings(rank_number);

CREATE INDEX idx_vip_rankings_scope
ON vip_rankings(ranking_scope);

CREATE INDEX idx_events_status
ON events(status);

CREATE INDEX idx_events_date
ON events(event_date);

CREATE INDEX idx_event_vips_event
ON event_vips(event_id);

CREATE INDEX idx_event_documents_event
ON event_documents(event_id);

CREATE INDEX idx_event_documents_category
ON event_documents(document_category);

CREATE INDEX idx_event_extractions_event
ON event_extractions(event_id);

CREATE INDEX idx_event_extractions_type
ON event_extractions(extraction_type);

CREATE INDEX idx_event_extractions_validation
ON event_extractions(validation_status);

CREATE INDEX idx_change_requests_status
ON change_requests(status);

COMMIT;