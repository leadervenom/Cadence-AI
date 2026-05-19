#!/bin/bash
# ─── Cadence Engine - Example cURL Requests ────────────────────────────────────
# Run these after starting the server: uvicorn main:app --reload

BASE="http://localhost:8000"

echo "=== 1. Health Check ==="
curl -s "$BASE/health" | python3 -m json.tool

echo ""
echo "=== 2. Generate Running Order ==="
curl -s -X POST "$BASE/generate-running-order" \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "id": "EVT-001",
      "name": "Tech Leadership Summit",
      "date": "2024-11-15",
      "venue": "Marina Bay Sands, Singapore",
      "start_time": "09:00",
      "end_time": "17:00",
      "speakers": [
        {
          "id": "SPK-001",
          "name": "Dr. Sarah Chen",
          "title": "Keynote: AI in 2025",
          "organization": "WEF",
          "duration_minutes": 45,
          "requirements": ["projector", "podium"]
        },
        {
          "id": "SPK-002",
          "name": "Minister Raj Pillai",
          "title": "Opening Address",
          "organization": "Govt. of Singapore",
          "duration_minutes": 20,
          "requirements": ["podium"]
        }
      ],
      "breaks": [
        {"start": "10:30", "end": "11:00", "label": "Coffee Break"},
        {"start": "13:00", "end": "14:00", "label": "Lunch"}
      ],
      "constraints": [
        {"type": "must_precede", "target_id": "SPK-001", "reference_id": "SPK-002"}
      ]
    }
  }' | python3 -m json.tool

echo ""
echo "=== 3. Generate Seating ==="
curl -s -X POST "$BASE/generate-seating" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVT-001",
    "head_table_guest_ids": ["G001"],
    "guests": [
      {
        "id": "G001",
        "name": "Minister Raj Pillai",
        "title": "Minister",
        "organization": "Govt. of Singapore",
        "vip_level": 5,
        "rank": 1,
        "role": "official",
        "dietary": ["halal"],
        "seating_constraints": [],
        "accessibility": false
      },
      {
        "id": "G002",
        "name": "Dr. Sarah Chen",
        "title": "Director",
        "organization": "WEF",
        "vip_level": 4,
        "rank": 2,
        "role": "keynote_speaker",
        "dietary": ["vegetarian"],
        "seating_constraints": [],
        "accessibility": false
      },
      {
        "id": "G003",
        "name": "James Whitfield",
        "title": "Managing Partner",
        "organization": "Apex Capital",
        "vip_level": 3,
        "rank": 3,
        "role": "sponsor",
        "dietary": [],
        "seating_constraints": [],
        "accessibility": true
      }
    ],
    "tables": [
      {"table_id": "T01", "table_number": 1, "capacity": 6, "zone": "head", "accessibility": true},
      {"table_id": "T02", "table_number": 2, "capacity": 8, "zone": "front", "accessibility": true},
      {"table_id": "T03", "table_number": 3, "capacity": 10, "zone": "middle", "accessibility": false}
    ]
  }' | python3 -m json.tool

echo ""
echo "=== 4. Real-Time Update: Delay ==="
curl -s -X POST "$BASE/update-event" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVT-001",
    "current_running_order": {
      "event_id": "EVT-001",
      "event_name": "Tech Leadership Summit",
      "generated_at": "2024-11-15T08:00:00",
      "total_duration_minutes": 480,
      "items": [
        {
          "sequence": 1,
          "item_id": "item_001",
          "title": "Opening Address",
          "type": "keynote",
          "start_time": "09:00",
          "end_time": "09:20",
          "duration_minutes": 20,
          "speaker_id": "SPK-002",
          "speaker_name": "Minister Raj Pillai",
          "location": "Main Hall",
          "notes": null,
          "status": "completed"
        },
        {
          "sequence": 2,
          "item_id": "item_002",
          "title": "Keynote: AI in 2025",
          "type": "keynote",
          "start_time": "09:20",
          "end_time": "10:05",
          "duration_minutes": 45,
          "speaker_id": "SPK-001",
          "speaker_name": "Dr. Sarah Chen",
          "location": "Main Hall",
          "notes": null,
          "status": "scheduled"
        }
      ],
      "warnings": []
    },
    "current_seating": null,
    "updates": [
      {
        "type": "delay",
        "target_id": "item_002",
        "delta_minutes": 15,
        "new_value": null,
        "reason": "Speaker running late"
      }
    ]
  }' | python3 -m json.tool
