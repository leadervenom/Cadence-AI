import pool from "../database/db.js";

const EXTRACTION_TYPES = [
  "running_order",
  "vip_list",
  "seating_layout",
  "traffic_flow",
  "full_event_snapshot",
];

function normalizeDate(value) {
  if (!value) return "TBD";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapStatus(status) {
  return status === "published" ? "live" : status || "draft";
}

function dbStatus(status) {
  return status === "live" ? "published" : status || "draft";
}

function defaultAiContext(eventName) {
  return `You are Cadence AI for ${eventName}. Help operators manage protocol, timing, VIPs, seating, traffic, and document context.`;
}

function toEvent(row, docs = [], extractions = {}, vips = []) {
  const runningOrder = extractions.running_order || [];
  const seating = extractions.seating_layout || { rows: [] };
  const traffic = extractions.traffic_flow || {
    route: [],
    eta_mins: 0,
    distance: "",
    convoy_size: 0,
  };
  const snapshot = extractions.full_event_snapshot || {};

  return {
    id: row.event_id,
    name: row.event_name,
    type: row.event_type || "Event",
    date: normalizeDate(row.event_date),
    venue: row.venue_name || "TBD",
    status: mapStatus(row.status),
    docs: docs.length,
    running_order: runningOrder,
    vips,
    sources: docs,
    seating,
    traffic,
    ai_context: snapshot.ai_context || defaultAiContext(row.event_name),
  };
}

class EventWorkspaceRepository {
  async listEvents() {
    const result = await pool.query(`
      SELECT e.*
      FROM events e
      ORDER BY e.created_at DESC, e.event_id DESC
    `);

    return Promise.all(result.rows.map(async (row) => {
      const documents = await this.getDocuments(row.event_id);
      return toEvent(row, documents);
    }));
  }

  async getEvent(eventId) {
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE event_id = $1",
      [eventId]
    );
    const event = eventResult.rows[0];
    if (!event) return null;

    const [documents, extractions, vips] = await Promise.all([
      this.getDocuments(eventId),
      this.getExtractions(eventId),
      this.getEventVips(eventId),
    ]);

    return toEvent(event, documents, extractions, vips);
  }

  async createEvent(payload) {
    const result = await pool.query(
      `
      INSERT INTO events (
        event_name,
        event_type,
        event_date,
        venue_name,
        status
      )
      VALUES ($1, $2, NULLIF($3, '')::date, $4, $5)
      RETURNING *
      `,
      [
        payload.name,
        payload.type || "Event",
        payload.date || null,
        payload.venue || null,
        dbStatus(payload.status),
      ]
    );

    const event = result.rows[0];
    await this.upsertExtraction(event.event_id, "running_order", []);
    await this.upsertExtraction(event.event_id, "seating_layout", { rows: [] });
    await this.upsertExtraction(event.event_id, "traffic_flow", {
      route: [],
      eta_mins: 0,
      distance: "",
      convoy_size: 0,
    });
    await this.upsertExtraction(event.event_id, "full_event_snapshot", {
      ai_context: payload.notes || defaultAiContext(event.event_name),
    });

    return this.getEvent(event.event_id);
  }

  async getDocuments(eventId) {
    const result = await pool.query(
      `
      SELECT
        document_id,
        file_name,
        file_type,
        document_category,
        storage_path,
        extraction_status,
        extracted_text,
        uploaded_at
      FROM event_documents
      WHERE event_id = $1
      ORDER BY uploaded_at DESC, document_id DESC
      `,
      [eventId]
    );

    return result.rows.map((row) => ({
      id: row.document_id,
      name: row.file_name,
      size: row.storage_path || "uploaded",
      status: row.extraction_status === "extracted" ? "parsed" : row.extraction_status,
      type: row.file_type || "file",
      category: row.document_category || "other",
      text: row.extracted_text || "",
      uploaded_at: row.uploaded_at,
    }));
  }

  async createDocument(eventId, payload) {
    const result = await pool.query(
      `
      INSERT INTO event_documents (
        event_id,
        file_name,
        file_type,
        document_category,
        storage_path,
        extracted_text,
        extraction_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'extracted')
      RETURNING document_id
      `,
      [
        eventId,
        payload.name,
        payload.type || "file",
        payload.category || "other",
        payload.size || null,
        payload.text || "",
      ]
    );

    return this.getDocument(result.rows[0].document_id);
  }

  async getDocument(documentId) {
    const result = await pool.query(
      "SELECT * FROM event_documents WHERE document_id = $1",
      [documentId]
    );
    return result.rows[0];
  }

  async getExtractions(eventId) {
    const result = await pool.query(
      `
      SELECT DISTINCT ON (extraction_type)
        extraction_type,
        extracted_data
      FROM event_extractions
      WHERE event_id = $1
      ORDER BY extraction_type, updated_at DESC, extraction_id DESC
      `,
      [eventId]
    );

    return result.rows.reduce((acc, row) => {
      if (EXTRACTION_TYPES.includes(row.extraction_type)) {
        acc[row.extraction_type] = row.extracted_data;
      }
      return acc;
    }, {});
  }

  async upsertExtraction(eventId, type, data) {
    const existing = await pool.query(
      `
      SELECT extraction_id
      FROM event_extractions
      WHERE event_id = $1 AND extraction_type = $2
      ORDER BY updated_at DESC, extraction_id DESC
      LIMIT 1
      `,
      [eventId, type]
    );

    if (existing.rows[0]) {
      await pool.query(
        `
        UPDATE event_extractions
        SET extracted_data = $1::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE extraction_id = $2
        `,
        [JSON.stringify(data), existing.rows[0].extraction_id]
      );
    } else {
      await pool.query(
        `
        INSERT INTO event_extractions (event_id, extraction_type, extracted_data)
        VALUES ($1, $2, $3::jsonb)
        `,
        [eventId, type, JSON.stringify(data)]
      );
    }

    return this.getEvent(eventId);
  }

  async getEventVips(eventId) {
    const result = await pool.query(
      `
      SELECT
        ev.event_vip_id,
        ev.event_rank_override,
        ev.attendance_status,
        vp.vip_id,
        vp.full_name,
        vp.position_title,
        vp.vip_category,
        vr.rank_number
      FROM event_vips ev
      JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
      LEFT JOIN vip_rankings vr ON vr.vip_id = vp.vip_id AND vr.is_current = TRUE
      WHERE ev.event_id = $1
      ORDER BY COALESCE(ev.event_rank_override, vr.rank_number, 9999), vp.full_name
      `,
      [eventId]
    );

    return result.rows.map((row) => ({
      id: row.event_vip_id,
      vip_id: row.vip_id,
      name: row.full_name,
      title: row.position_title || "",
      category: row.vip_category || "vip",
      rank: row.event_rank_override || row.rank_number || 999,
      status: row.attendance_status || "invited",
    }));
  }

  async replaceEventVips(eventId, vips) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM event_vips WHERE event_id = $1", [eventId]);

      for (const vip of vips) {
        let vipId = vip.vip_id;
        if (!vipId) {
          const profile = await client.query(
            `
            INSERT INTO vip_profiles (full_name, position_title, vip_category)
            VALUES ($1, $2, $3)
            RETURNING vip_id
            `,
            [vip.name, vip.title || null, vip.category || "vip"]
          );
          vipId = profile.rows[0].vip_id;
        }

        await client.query(
          `
          INSERT INTO event_vips (
            event_id,
            vip_id,
            event_rank_override,
            attendance_status
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (event_id, vip_id)
          DO UPDATE SET
            event_rank_override = EXCLUDED.event_rank_override,
            attendance_status = EXCLUDED.attendance_status,
            updated_at = CURRENT_TIMESTAMP
          `,
          [eventId, vipId, vip.rank || null, vip.status || "invited"]
        );
      }

      await client.query("COMMIT");
      return this.getEvent(eventId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default EventWorkspaceRepository;
