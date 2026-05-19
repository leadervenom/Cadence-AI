const API = window.location.origin;

let isDesktopApp = false;
let currentRunningOrder = null;
let seatingGuestCount = 0;

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
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
    toast("Quit is only available in desktop mode.");
    return;
  }
  try {
    await window.pywebview.api.quit_app();
  } catch (err) {
    toast(`Quit failed: ${err.message}`);
  }
}

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

async function loadCurrentRunningOrder() {
  try {
    const res = await fetch(`${API}/running-order/current`);
    const body = await res.json();
    if (res.ok && body.success && body.data && body.data.running_order) {
      currentRunningOrder = body.data.running_order;
      renderRunningOrder(currentRunningOrder);
      document.getElementById("upload-status").textContent = "Loaded latest running order from server state.";
    }
  } catch {
    // Keep silent; initial load should not throw user-facing errors.
  }
}

function setGenerateButtonLoading(isLoading) {
  const btn = document.getElementById("generate-btn");
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Generating..." : "Generate From Document";
}

async function generateFromDocument() {
  const fileInput = document.getElementById("protocol-file");
  const statusEl = document.getElementById("upload-status");
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    toast("Select a protocol file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  setGenerateButtonLoading(true);
  statusEl.textContent = "Uploading and generating running order...";

  try {
    const res = await fetch(`${API}/upload-protocol`, {
      method: "POST",
      body: formData,
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      const msg = body.detail || body.error || "Failed to generate running order.";
      statusEl.textContent = msg;
      toast("Generation failed.");
      return;
    }

    currentRunningOrder = body.data.running_order;
    renderRunningOrder(currentRunningOrder);
    statusEl.textContent = `Generated from ${body.data.source_file}`;
    if (body.retries_used > 0) {
      toast(`Generated after ${body.retries_used} retry/retries.`);
    }
  } catch (err) {
    statusEl.textContent = `Could not reach API: ${err.message}`;
    toast("Connection failed.");
  } finally {
    setGenerateButtonLoading(false);
  }
}

async function sendInstruction(instruction, silent = false) {
  const payload = { instruction };
  try {
    const res = await fetch(`${API}/edit-running-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      const msg = body.detail || body.error || "Edit failed.";
      if (!silent) toast(msg);
      return false;
    }

    currentRunningOrder = body.data.running_order;
    renderRunningOrder(currentRunningOrder);
    if (!silent) toast("Running order updated.");
    return true;
  } catch (err) {
    if (!silent) toast(`Edit failed: ${err.message}`);
    return false;
  }
}

async function applyInstructionEdit() {
  const input = document.getElementById("edit-instruction");
  const instruction = input.value.trim();
  if (!instruction) {
    toast("Enter an edit instruction.");
    return;
  }
  if (!currentRunningOrder) {
    toast("Upload a protocol first.");
    return;
  }
  const ok = await sendInstruction(instruction);
  if (ok) input.value = "";
}

function renderRunningOrder(order) {
  const container = document.getElementById("running-order-view");
  if (!order || !order.items || !order.items.length) {
    container.className = "panel-placeholder";
    container.textContent = "No running order available.";
    return;
  }

  const warningHtml = (order.warnings || []).length
    ? `<div class="warning-box">${order.warnings.map(w => `<div>• ${escapeHtml(w)}</div>`).join("")}</div>`
    : "";

  const rows = order.items.map(item => {
    return `
      <tr>
        <td>${item.sequence}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="start_time">${escapeHtml(item.start_time)}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="end_time">${escapeHtml(item.end_time)}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="title">${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.type)}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="speaker_name">${escapeHtml(item.speaker_name || "")}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="location">${escapeHtml(item.location || "")}</td>
        <td class="editable" data-seq="${item.sequence}" data-field="notes">${escapeHtml(item.notes || "")}</td>
      </tr>`;
  }).join("");

  container.className = "table-wrap";
  container.innerHTML = `
    <div class="summary-row">
      <div><strong>${escapeHtml(order.event_name)}</strong></div>
      <div>${order.items.length} items • ${order.total_duration_minutes} min</div>
    </div>
    <table class="result-table" id="running-order-table">
      <thead>
        <tr>
          <th>#</th><th>Start</th><th>End</th><th>Title</th><th>Type</th><th>Speaker</th><th>Location</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${warningHtml}`;

  bindInlineEditHandlers();
}

function bindInlineEditHandlers() {
  const cells = document.querySelectorAll("#running-order-table td.editable");
  cells.forEach(cell => {
    cell.addEventListener("click", () => activateInlineEdit(cell));
  });
}

function activateInlineEdit(cell) {
  if (cell.querySelector("input")) return;

  const original = cell.textContent.trim();
  const input = document.createElement("input");
  input.type = "text";
  input.value = original;
  input.className = "inline-input";

  cell.textContent = "";
  cell.appendChild(input);
  input.focus();
  input.select();

  const commit = async () => {
    const value = input.value.trim();
    if (!value || value === original) {
      cell.textContent = original;
      return;
    }

    const sequence = cell.dataset.seq;
    const field = cell.dataset.field;
    const item = currentRunningOrder.items.find(i => String(i.sequence) === String(sequence));
    const refTitle = item ? item.title : "this agenda item";
    const fieldLabel = field.replace("_", " ");

    const instruction = `For item ${sequence} (${refTitle}), change ${fieldLabel} to "${value}". Modify only what is necessary.`;
    const ok = await sendInstruction(instruction, true);
    if (!ok) {
      cell.textContent = original;
      toast("Inline edit failed.");
    }
  };

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cell.textContent = original;
  });
  input.addEventListener("blur", commit);
}

function addSeatingGuest() {
  seatingGuestCount += 1;
  const host = document.getElementById("seating-guests");
  const row = document.createElement("div");
  row.className = "guest-row";
  row.innerHTML = `
    <input class="guest-name" type="text" placeholder="Guest name"/>
    <select class="guest-role">
      <option value="official">Official</option>
      <option value="keynote_speaker">Keynote Speaker</option>
      <option value="vip_guest">VIP Guest</option>
      <option value="sponsor">Sponsor</option>
      <option value="delegate">Delegate</option>
      <option value="staff">Staff</option>
      <option value="general">General</option>
    </select>
    <select class="guest-vip">
      <option value="5">VIP 5</option>
      <option value="4">VIP 4</option>
      <option value="3" selected>VIP 3</option>
      <option value="2">VIP 2</option>
      <option value="1">VIP 1</option>
      <option value="0">VIP 0</option>
    </select>
    <button class="icon-btn" title="Remove" onclick="this.parentElement.remove()">×</button>`;
  host.appendChild(row);
}

async function generateSimpleSeating() {
  const guestRows = document.querySelectorAll("#seating-guests .guest-row");
  const guests = [];

  guestRows.forEach(row => {
    const name = row.querySelector(".guest-name").value.trim();
    if (!name) return;
    guests.push({
      name,
      role: row.querySelector(".guest-role").value,
      vip_level: parseInt(row.querySelector(".guest-vip").value, 10),
    });
  });

  if (!guests.length) {
    toast("Add at least one guest name.");
    return;
  }

  const payload = {
    event_name: document.getElementById("seat-event-name").value.trim() || "Cadence Event",
    table_count: parseInt(document.getElementById("seat-table-count").value, 10) || 8,
    table_capacity: parseInt(document.getElementById("seat-table-capacity").value, 10) || 8,
    guests,
  };

  const resultEl = document.getElementById("seating-result");
  resultEl.className = "panel-placeholder";
  resultEl.textContent = "Generating seating...";

  try {
    const res = await fetch(`${API}/generate-seating/simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      resultEl.textContent = body.detail || body.error || "Seating generation failed.";
      return;
    }

    renderSimpleSeating(body.data);
  } catch (err) {
    resultEl.textContent = `Could not reach API: ${err.message}`;
  }
}

function renderSimpleSeating(data) {
  const resultEl = document.getElementById("seating-result");
  const rows = (data.assignments || []).map(row => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.role)}</td>
      <td>${row.vip_level}</td>
      <td>${row.table_number}</td>
      <td>${row.seat_number}</td>
      <td>${escapeHtml(row.zone)}</td>
    </tr>
  `).join("");

  const warnings = (data.warnings || []).length
    ? `<div class="warning-box">${data.warnings.map(w => `<div>• ${escapeHtml(w)}</div>`).join("")}</div>`
    : "";

  resultEl.className = "table-wrap";
  resultEl.innerHTML = `
    <div class="summary-row">
      <div><strong>${escapeHtml(data.event_name || "Seating Plan")}</strong></div>
      <div>${data.total_guests} guests • ${data.total_tables} tables</div>
    </div>
    <table class="result-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>VIP</th><th>Table</th><th>Seat</th><th>Zone</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${warnings}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.addEventListener("DOMContentLoaded", () => {
  detectDesktopMode();
  checkHealth();
  setInterval(checkHealth, 30000);
  addSeatingGuest();
  addSeatingGuest();
  loadCurrentRunningOrder();

  const editInput = document.getElementById("edit-instruction");
  editInput.addEventListener("keydown", async e => {
    if (e.key === "Enter") {
      e.preventDefault();
      await applyInstructionEdit();
    }
  });
});

window.addEventListener("pywebviewready", detectDesktopMode);
