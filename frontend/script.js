const API_URL = "http://127.0.0.1:8000";

const jobForm = document.getElementById("jobForm");
const refreshBtn = document.getElementById("refreshBtn");
const queueList = document.getElementById("queueList");

let currentJobs = [];
let deletingIds = new Set();

async function loadJobs() {
  try {
    const res = await fetch(`${API_URL}/jobs`);
    if (!res.ok) throw new Error("Fehler beim Laden");
    const jobs = await res.json();
    currentJobs = jobs;

    if (jobs.length === 0) {
      queueList.innerHTML = '<div class="empty-state">Keine Aufträge in der Warteschlange.</div>';
      return;
    }

    const firstWaitingJob = jobs.find(job => job.status === "warten");
    const firstWaitingId = firstWaitingJob ? firstWaitingJob.id : null;
    const isPrinterBusy = jobs.some(job => job.status === "drucken");

    queueList.innerHTML = "";
    
    jobs.forEach(job => {
      const row = document.createElement("div");
      row.className = "job-row";

      const canStart = (job.status === "warten" && job.id === firstWaitingId && !isPrinterBusy);

      let actionButtonsHtml = "";
      if (job.status === "warten") {
        if (canStart) {
          actionButtonsHtml = `<button class="btn-tonal" onclick="setStatus(${job.id}, 'drucken')">Druck starten</button>`;
        } else {
          actionButtonsHtml = `<span style="font-size: 0.8rem; color: var(--text-secondary);">Wartet auf Vorgänger</span>`;
        }
      }

      const progressHtml = job.status === "drucken" ? `
        <div class="progress-wrapper">
          <div class="progress-header">
            <span>Druckt...</span>
            <span id="timer-${job.id}">Berechne...</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="bar-${job.id}"></div>
          </div>
        </div>
      ` : "";

      row.innerHTML = `
        <div class="job-main" style="flex: 1;">
          <div class="job-header">
            <span class="job-id">#${job.id}</span>
            <span class="job-file"></span>
            <span class="chip chip-${job.status}">${job.status}</span>
          </div>
          <div class="job-details">
            <span>Von: <strong class="job-name"></strong></span>
            <span>•</span>
            <span>Dauer: <strong>${job.estimatedTime} Min.</strong></span>
          </div>
          ${progressHtml}
        </div>

        <div class="job-actions">
          ${actionButtonsHtml}
          <button class="btn-icon-danger" onclick="removeJob(${job.id})" title="Auftrag abbrechen/löschen">Löschen</button>
        </div>
      `;

      row.querySelector(".job-file").textContent = job.fileName;
      row.querySelector(".job-name").textContent = job.name;

      queueList.appendChild(row);
    });

    updateTimers();
  } catch (err) {
    queueList.innerHTML = '<div class="empty-state error-text">Backend nicht erreichbar (Port 8000 prüfen).</div>';
  }
}

function updateTimers() {
  const nowSec = Date.now() / 1000;

  currentJobs.forEach(job => {
    if (job.status === "drucken" && job.startedAt) {
      const totalSeconds = job.estimatedTime * 60;
      const elapsedSeconds = nowSec - job.startedAt;
      const remainingSeconds = Math.max(0, Math.ceil(totalSeconds - elapsedSeconds));
      const percent = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

      const timerEl = document.getElementById(`timer-${job.id}`);
      const barEl = document.getElementById(`bar-${job.id}`);

      if (timerEl && barEl) {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} verbleibend`;
        barEl.style.width = `${percent}%`;
      }

      if (remainingSeconds <= 0 && !deletingIds.has(job.id)) {
        deletingIds.add(job.id);
        removeJob(job.id);
      }
    }
  });
}

setInterval(updateTimers, 1000);


jobForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    fileName: document.getElementById("fileName").value.trim(),
    estimatedTime: parseInt(document.getElementById("estimatedTime").value, 10)
  };

  try {
    const res = await fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Fehler beim Anlegen");
    jobForm.reset();
    loadJobs();
  } catch (err) {
    alert("Auftrag konnte nicht gespeichert werden.");
  }
});

async function setStatus(jobId, status) {
  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Status-Update fehlgeschlagen");
    }
        
    loadJobs();
  } catch (err) {
    alert(err.message);
  }
}

async function removeJob(jobId) {
  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}?jobId=${jobId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Löschen fehlgeschlagen");
    deletingIds.delete(jobId);
    loadJobs();
  } catch (err) {
    deletingIds.delete(jobId);
    alert(err.message);
  }
}

refreshBtn.addEventListener("click", loadJobs);
loadJobs();