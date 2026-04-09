/* ═══════════════════════════════════════════════════════════════
   Cadence Engine — app.js
   All API calls, dynamic form logic, and result rendering.
═══════════════════════════════════════════════════════════════ */

// Use same-origin API so browser mode and desktop mode both work.
const API = window.location.origin;

/* ─── Counters for unique IDs ─────────────────────────────────── */
let speakerCount = 0;
let breakCount   = 0;
let tableCount   = 0;
let guestCount   = 0;
let updateCount  = 0;
let isDesktopApp = false;

/* ═══════════════════════════════════════════════════════════════
   TAB NAVIGATION
═══════════════════════════════════════════════════════════════ */
function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event.currentTarget.classList.add("active");
}

/* ═══════════════════════════════════════════════════════════════
   HEALTH CHECK
═══════════════════════════════════════════════════════════════ */
async function checkHealth() {
  const badge = document.getElementById("health-badge");
  try {
    const r = await fetch(`${API}/health`);
    const d = await r.json();
    if (d.status === "ok") {
      badge.textContent = "● Online";
      badge.className = "health-badge ok";
    } else {
      badge.textContent = "● Degraded";
      badge.className = "health-badge err";
    }
  } catch {
    badge.textContent = "● Offline";
    badge.className = "health-badge err";
  }
}
checkHealth();
setInterval(checkHealth, 30000);

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

function setQuitButtonVisibility() {
  const quitBtn = document.getElementById("quit-btn");
  if (!quitBtn) return;
  quitBtn.style.display = isDesktopApp ? "inline-block" : "none";
}

function detectDesktopMode() {
  isDesktopApp = Boolean(window.pywebview && window.pywebview.api);
  setQuitButtonVisibility();
}

async function quitApp() {
  if (!isDesktopApp || !window.pywebview || !window.pywebview.api) {
    toast("Quit button is only available in desktop mode.");
    return;
  }
  try {
    await window.pywebview.api.quit_app();
  } catch (err) {
    toast(`Quit failed: ${err.message}`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   LOADING / ERROR HELPERS
═══════════════════════════════════════════════════════════════ */
function showLoading(panelId) {
  document.getElementById(panelId).innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Cadence Engine is thinking...</p>
    </div>`;
}

function showError(panelId, msg) {
  document.getElementById(panelId).innerHTML = `
    <div class="error-box">
      <strong>Error</strong>${msg}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   COPY RESULT
═══════════════════════════════════════════════════════════════ */
function copyResult(panelId) {
  const el = document.getElementById(panelId);
  const text = el.dataset.raw || el.innerText;
  navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard!"));
}

/* ═══════════════════════════════════════════════════════════════
   ─── TAB 1: RUNNING ORDER ────────────────────────────────────
═══════════════════════════════════════════════════════════════ */

function addSpeaker() {
  speakerCount++;
  const id = `spk-${speakerCount}`;
  const div = document.createElement("div");
  div.className = "dynamic-card";
  div.id = id;
  div.innerHTML = `
    <div class="card-num">SPEAKER ${speakerCount}</div>
    <button class="card-remove" onclick="removeCard('${id}')" title="Remove">×</button>
    <div class="row-2">
      <div class="form-group">
        <label>Speaker Name</label>
        <input type="text" class="spk-name" placeholder="e.g. Dr. Sarah Chen"/>
      </div>
      <div class="form-group">
        <label>Organization</label>
        <input type="text" class="spk-org" placeholder="e.g. World Economic Forum"/>
      </div>
    </div>
    <div class="form-group">
      <label>Session Title</label>
      <input type="text" class="spk-title" placeholder="e.g. Keynote: The Future of AI"/>
    </div>
    <div class="row-2">
      <div class="form-group">
        <label>Duration (minutes)</label>
        <input type="number" class="spk-duration" value="30" min="5" max="480"/>
      </div>
      <div class="form-group">
        <label>Session Type</label>
        <select class="spk-type">
          <option value="keynote">Keynote</option>
          <option value="session" selected>Session</option>
          <option value="panel">Panel</option>
          <option value="ceremony">Ceremony</option>
          <option value="networking">Networking</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>`;
  document.getElementById("speakers-list").appendChild(div);
}

function addBreak() {
  breakCount++;
  const id = `brk-${breakCount}`;
  const div = document.createElement("div");
  div.className = "dynamic-card";
  div.id = id;
  div.innerHTML = `
    <div class="card-num">BREAK ${breakCount}</div>
    <button class="card-remove" onclick="removeCard('${id}')" title="Remove">×</button>
    <div class="row-3">
      <div class="form-group">
        <label>Label</label>
        <input type="text" class="brk-label" placeholder="e.g. Lunch Break"/>
      </div>
      <div class="form-group">
        <label>Start Time</label>
        <input type="time" class="brk-start" value="12:00"/>
      </div>
      <div class="form-group">
        <label>End Time</label>
        <input type="time" class="brk-end" value="13:00"/>
      </div>
    </div>`;
  document.getElementById("breaks-list").appendChild(div);
}

function removeCard(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function generateRunningOrder() {
  const name      = document.getElementById("ro-event-name").value.trim();
  const date      = document.getElementById("ro-event-date").value;
  const venue     = document.getElementById("ro-venue").value.trim();
  const startTime = document.getElementById("ro-start-time").value;
  const endTime   = document.getElementById("ro-end-time").value;

  if (!name)  { toast("Please enter an event name."); return; }
  if (!venue) { toast("Please enter a venue."); return; }

  // Build speakers
  const speakers = [];
  document.querySelectorAll("#speakers-list .dynamic-card").forEach((card, i) => {
    const spkName = card.querySelector(".spk-name").value.trim();
    if (!spkName) return;
    speakers.push({
      id: `SPK-${String(i+1).padStart(3,"0")}`,
      name: spkName,
      title: card.querySelector(".spk-title").value.trim() || spkName,
      organization: card.querySelector(".spk-org").value.trim() || "N/A",
      duration_minutes: parseInt(card.querySelector(".spk-duration").value) || 30,
      requirements: []
    });
  });

  // Build breaks
  const breaks = [];
  document.querySelectorAll("#breaks-list .dynamic-card").forEach(card => {
    const s = card.querySelector(".brk-start").value;
    const e = card.querySelector(".brk-end").value;
    const l = card.querySelector(".brk-label").value.trim();
    if (s && e) breaks.push({ start: s, end: e, label: l || "Break" });
  });

  const payload = {
    event: {
      id: `EVT-${Date.now()}`,
      name,
      date: date || new Date().toISOString().split("T")[0],
      venue,
      start_time: startTime,
      end_time: endTime,
      speakers,
      breaks,
      constraints: []
    }
  };

  const btn = document.querySelector("#tab-running-order .submit-btn");
  btn.disabled = true;
  showLoading("ro-result");

  try {
    const res  = await fetch(`${API}/generate-running-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showError("ro-result", data.detail || data.error || "Unknown error from API.");
    } else {
      renderRunningOrder(data.data);
      document.getElementById("ro-result").dataset.raw = JSON.stringify(data.data, null, 2);
      if (data.retries_used > 0) toast(`⚠ Generated after ${data.retries_used} retry/retries`);
    }
  } catch (err) {
    showError("ro-result", `Could not reach the API. Is the server running?<br><code>${err.message}</code>`);
  } finally {
    btn.disabled = false;
  }
}

function renderRunningOrder(data) {
  const panel = document.getElementById("ro-result");
  if (!data || !data.items) { showError("ro-result", "No items in response."); return; }

  const warnings = (data.warnings || []).length > 0
    ? `<div class="warning-box"><strong>⚠ Warnings</strong>${data.warnings.join("<br>")}</div>` : "";

  let rows = data.items.map(item => `
    <tr>
      <td style="color:var(--text-dim);font-family:var(--mono)">${item.sequence}</td>
      <td><span style="color:var(--text-hi);font-weight:600">${item.start_time}</span> – ${item.end_time}</td>
      <td>${item.title}</td>
      <td><span class="badge badge-${item.type}">${item.type}</span></td>
      <td>${item.speaker_name || "<span style='color:var(--text-dim)'>—</span>"}</td>
      <td>${item.duration_minutes} min</td>
      <td><span class="badge-${item.status}">${item.status}</span></td>
    </tr>`).join("");

  panel.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-family:var(--sans);font-size:15px;font-weight:700;color:var(--text-hi)">${data.event_name}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:3px">
        ${data.items.length} items · ${data.total_duration_minutes} min total
      </div>
    </div>
    <table class="result-table">
      <thead><tr>
        <th>#</th><th>Time</th><th>Title</th><th>Type</th><th>Speaker</th><th>Duration</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${warnings}`;
}

/* ═══════════════════════════════════════════════════════════════
   ─── TAB 2: SEATING ──────────────────────────────────────────
═══════════════════════════════════════════════════════════════ */

function addTable() {
  tableCount++;
  const id = `tbl-${tableCount}`;
  const div = document.createElement("div");
  div.className = "dynamic-card";
  div.id = id;
  div.innerHTML = `
    <div class="card-num">TABLE ${tableCount}</div>
    <button class="card-remove" onclick="removeCard('${id}')" title="Remove">×</button>
    <div class="row-3">
      <div class="form-group">
        <label>Capacity</label>
        <input type="number" class="tbl-cap" value="8" min="1" max="50"/>
      </div>
      <div class="form-group">
        <label>Zone</label>
        <select class="tbl-zone">
          <option value="head">Head</option>
          <option value="front">Front</option>
          <option value="middle" selected>Middle</option>
          <option value="rear">Rear</option>
          <option value="side">Side</option>
        </select>
      </div>
      <div class="form-group">
        <label>Accessible?</label>
        <select class="tbl-access">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>
    </div>`;
  document.getElementById("tables-list").appendChild(div);
}

function addGuest() {
  guestCount++;
  const gid = `G${String(guestCount).padStart(3,"0")}`;
  const id  = `gst-${guestCount}`;
  const div = document.createElement("div");
  div.className = "dynamic-card";
  div.id = id;
  div.innerHTML = `
    <div class="card-num">GUEST ${guestCount} <span style="color:var(--text-dim)">(ID: ${gid})</span></div>
    <button class="card-remove" onclick="removeCard('${id}')" title="Remove">×</button>
    <input type="hidden" class="gst-id" value="${gid}"/>
    <div class="row-2">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" class="gst-name" placeholder="e.g. Minister Raj Pillai"/>
      </div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" class="gst-title" placeholder="e.g. Minister of Trade"/>
      </div>
    </div>
    <div class="row-2">
      <div class="form-group">
        <label>Organization</label>
        <input type="text" class="gst-org" placeholder="e.g. Government of Singapore"/>
      </div>
      <div class="form-group">
        <label>Role</label>
        <select class="gst-role">
          <option value="official">Official</option>
          <option value="keynote_speaker">Keynote Speaker</option>
          <option value="vip_guest">VIP Guest</option>
          <option value="sponsor">Sponsor</option>
          <option value="delegate">Delegate</option>
          <option value="staff">Staff</option>
          <option value="general">General</option>
        </select>
      </div>
    </div>
    <div class="row-3">
      <div class="form-group">
        <label>VIP Level (0–5)</label>
        <input type="number" class="gst-vip" value="3" min="0" max="5"/>
      </div>
      <div class="form-group">
        <label>Rank (lower = higher)</label>
        <input type="number" class="gst-rank" value="${guestCount}" min="1"/>
      </div>
      <div class="form-group">
        <label>Accessible Seat?</label>
        <select class="gst-access">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Dietary Requirements <span class="hint">(comma-separated)</span></label>
      <input type="text" class="gst-dietary" placeholder="e.g. halal, vegetarian"/>
    </div>`;
  document.getElementById("guests-list").appendChild(div);
}

async function generateSeating() {
  const eventId = document.getElementById("seat-event-id").value.trim() || `EVT-${Date.now()}`;

  // Build tables
  const tables = [];
  document.querySelectorAll("#tables-list .dynamic-card").forEach((card, i) => {
    tables.push({
      table_id: `T${String(i+1).padStart(2,"0")}`,
      table_number: i + 1,
      capacity: parseInt(card.querySelector(".tbl-cap").value) || 8,
      zone: card.querySelector(".tbl-zone").value,
      accessibility: card.querySelector(".tbl-access").value === "true"
    });
  });

  // Build guests
  const guests = [];
  document.querySelectorAll("#guests-list .dynamic-card").forEach(card => {
    const name = card.querySelector(".gst-name").value.trim();
    if (!name) return;
    const dietary = card.querySelector(".gst-dietary").value.trim();
    guests.push({
      id: card.querySelector(".gst-id").value,
      name,
      title: card.querySelector(".gst-title").value.trim() || name,
      organization: card.querySelector(".gst-org").value.trim() || "N/A",
      role: card.querySelector(".gst-role").value,
      vip_level: parseInt(card.querySelector(".gst-vip").value) || 0,
      rank: parseInt(card.querySelector(".gst-rank").value) || 99,
      accessibility: card.querySelector(".gst-access").value === "true",
      dietary: dietary ? dietary.split(",").map(s => s.trim()).filter(Boolean) : [],
      seating_constraints: []
    });
  });

  if (!guests.length) { toast("Please add at least one guest."); return; }
  if (!tables.length) { toast("Please add at least one table."); return; }

  const headRaw = document.getElementById("head-table-ids").value.trim();
  const headIds = headRaw ? headRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  const payload = { event_id: eventId, guests, tables, head_table_guest_ids: headIds };

  const btn = document.querySelector("#tab-seating .submit-btn");
  btn.disabled = true;
  showLoading("seat-result");

  try {
    const res  = await fetch(`${API}/generate-seating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showError("seat-result", data.detail || data.error || "Unknown error from API.");
    } else {
      renderSeating(data.data);
      document.getElementById("seat-result").dataset.raw = JSON.stringify(data.data, null, 2);
    }
  } catch (err) {
    showError("seat-result", `Could not reach the API.<br><code>${err.message}</code>`);
  } finally {
    btn.disabled = false;
  }
}

function renderSeating(data) {
  const panel = document.getElementById("seat-result");
  if (!data || !data.layout) { showError("seat-result", "No layout in response."); return; }

  const warnings = (data.warnings || []).length > 0
    ? `<div class="warning-box"><strong>⚠ Warnings</strong>${data.warnings.join("<br>")}</div>` : "";

  const unassigned = (data.unassigned || []).length > 0
    ? `<div class="warning-box"><strong>⚠ Unassigned Guests</strong>${data.unassigned.join(", ")}</div>` : "";

  let rows = data.layout.map(s => `
    <tr>
      <td style="font-family:var(--mono);color:var(--text-dim)">${s.table_number}</td>
      <td style="font-family:var(--mono);color:var(--text-dim)">${s.seat_number}</td>
      <td style="color:var(--text-hi);font-weight:600">${s.guest_name}</td>
      <td style="color:var(--text-dim);font-size:11px">${s.guest_title}</td>
      <td><span class="badge badge-keynote">${s.zone}</span></td>
      <td><span class="vip-stars">${"★".repeat(s.vip_level)}${"☆".repeat(5-s.vip_level)}</span></td>
      <td style="color:var(--text-dim);font-size:11px">${s.notes || "—"}</td>
    </tr>`).join("");

  panel.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-family:var(--sans);font-size:15px;font-weight:700;color:var(--text-hi)">Seating Layout</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:3px">
        ${data.total_guests} guests · ${data.total_tables} tables
      </div>
    </div>
    <table class="result-table">
      <thead><tr>
        <th>Table</th><th>Seat</th><th>Guest</th><th>Title</th><th>Zone</th><th>VIP</th><th>Notes</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${unassigned}${warnings}`;
}

/* ═══════════════════════════════════════════════════════════════
   ─── TAB 3: LIVE UPDATES ─────────────────────────────────────
═══════════════════════════════════════════════════════════════ */

function addUpdate() {
  updateCount++;
  const id  = `upd-${updateCount}`;
  const div = document.createElement("div");
  div.className = "dynamic-card";
  div.id = id;
  div.innerHTML = `
    <div class="card-num">UPDATE ${updateCount}</div>
    <button class="card-remove" onclick="removeCard('${id}')" title="Remove">×</button>
    <div class="row-2">
      <div class="form-group">
        <label>Update Type</label>
        <select class="upd-type" onchange="toggleDelta(this, '${id}')">
          <option value="delay">Delay</option>
          <option value="cancellation">Cancellation</option>
          <option value="vip_arrival">VIP Arrival</option>
          <option value="vip_removal">VIP Removal</option>
          <option value="venue_change">Venue Change</option>
          <option value="time_change">Time Change</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target ID <span class="hint">(item_id or guest_id)</span></label>
        <input type="text" class="upd-target" placeholder="e.g. item_003 or G001"/>
      </div>
    </div>
    <div class="row-2">
      <div class="form-group upd-delta-group">
        <label>Delay (minutes)</label>
        <input type="number" class="upd-delta" value="15" min="1"/>
      </div>
      <div class="form-group">
        <label>New Value <span class="hint">(for venue/time change)</span></label>
        <input type="text" class="upd-newval" placeholder="e.g. Hall B or 10:30"/>
      </div>
    </div>
    <div class="form-group">
      <label>Reason</label>
      <input type="text" class="upd-reason" placeholder="e.g. Speaker running late"/>
    </div>`;
  document.getElementById("updates-list").appendChild(div);
}

function toggleDelta(sel, cardId) {
  const card  = document.getElementById(cardId);
  const group = card.querySelector(".upd-delta-group");
  group.style.display = sel.value === "delay" ? "flex" : "none";
}

async function applyUpdate() {
  const eventId = document.getElementById("upd-event-id").value.trim();
  if (!eventId) { toast("Please enter an Event ID."); return; }

  // Build updates array
  const updates = [];
  document.querySelectorAll("#updates-list .dynamic-card").forEach(card => {
    const type   = card.querySelector(".upd-type").value;
    const target = card.querySelector(".upd-target").value.trim();
    if (!target) return;
    const delta  = parseInt(card.querySelector(".upd-delta").value) || null;
    const newval = card.querySelector(".upd-newval").value.trim() || null;
    const reason = card.querySelector(".upd-reason").value.trim() || null;
    updates.push({
      type,
      target_id: target,
      delta_minutes: type === "delay" ? delta : null,
      new_value: newval,
      reason
    });
  });

  if (!updates.length) { toast("Please add at least one update."); return; }

  // Parse optional JSON inputs
  let running_order = null, current_seating = null;
  const roRaw   = document.getElementById("upd-running-order").value.trim();
  const seatRaw = document.getElementById("upd-seating").value.trim();
  try { if (roRaw)   running_order   = JSON.parse(roRaw); } catch { toast("Running Order JSON is invalid."); return; }
  try { if (seatRaw) current_seating = JSON.parse(seatRaw); } catch { toast("Seating JSON is invalid."); return; }

  const payload = { event_id: eventId, updates, current_running_order: running_order, current_seating };

  const btn = document.querySelector("#tab-updates .submit-btn");
  btn.disabled = true;
  showLoading("upd-result");

  try {
    const res  = await fetch(`${API}/update-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showError("upd-result", data.detail || data.error || "Unknown error from API.");
    } else {
      renderUpdateResult(data.data);
      document.getElementById("upd-result").dataset.raw = JSON.stringify(data.data, null, 2);
    }
  } catch (err) {
    showError("upd-result", `Could not reach the API.<br><code>${err.message}</code>`);
  } finally {
    btn.disabled = false;
  }
}

function renderUpdateResult(data) {
  const panel = document.getElementById("upd-result");

  const changes = (data.changes_applied || []);
  const warnings = (data.warnings || []);

  let html = `<div style="font-family:var(--sans);font-size:15px;font-weight:700;color:var(--text-hi);margin-bottom:14px">Update Applied</div>`;

  if (changes.length) {
    html += `<div class="warning-box" style="background:var(--green-lo);border-color:rgba(34,197,94,0.3);color:var(--green)">
      <strong>✓ Changes Applied</strong>${changes.map(c => `• ${c}`).join("<br>")}
    </div>`;
  }

  if (data.running_order) {
    html += `<div style="margin-top:16px;font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Updated Running Order</div>`;
    html += buildMiniRunningOrderTable(data.running_order);
  }

  if (data.seating_layout) {
    html += `<div style="margin-top:16px;font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Updated Seating</div>`;
    html += buildMiniSeatingTable(data.seating_layout);
  }

  if (warnings.length) {
    html += `<div class="warning-box" style="margin-top:12px"><strong>⚠ Warnings</strong>${warnings.join("<br>")}</div>`;
  }

  panel.innerHTML = html;
}

function buildMiniRunningOrderTable(ro) {
  if (!ro.items) return "<p style='color:var(--text-dim)'>No items.</p>";
  const rows = ro.items.map(i => `
    <tr>
      <td style="font-family:var(--mono);color:var(--amber)">${i.start_time}</td>
      <td>${i.title}</td>
      <td><span class="badge badge-${i.type}">${i.type}</span></td>
      <td><span class="badge-${i.status}">${i.status}</span></td>
    </tr>`).join("");
  return `<table class="result-table"><thead><tr><th>Time</th><th>Title</th><th>Type</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function buildMiniSeatingTable(sl) {
  if (!sl.layout) return "<p style='color:var(--text-dim)'>No layout.</p>";
  const rows = sl.layout.map(s => `
    <tr>
      <td style="font-family:var(--mono);color:var(--text-dim)">${s.table_number}-${s.seat_number}</td>
      <td style="color:var(--text-hi)">${s.guest_name}</td>
      <td><span class="badge badge-keynote">${s.zone}</span></td>
      <td>${s.notes || "—"}</td>
    </tr>`).join("");
  return `<table class="result-table"><thead><tr><th>Seat</th><th>Guest</th><th>Zone</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* ─── Pre-populate one speaker and one table on load ─────────── */
window.addEventListener("DOMContentLoaded", () => {
  detectDesktopMode();
  addSpeaker();
  addBreak();
  addTable();
  addGuest();
  addUpdate();
});

window.addEventListener("pywebviewready", () => {
  detectDesktopMode();
});
