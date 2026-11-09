const API_URL = "http://127.0.0.1:8000";

const jobForm = document.getElementById("jobForm");
const refreshBtn = document.getElementById("refreshBtn");
const queueList = document.getElementById("queueList");

// 1. Alle Jobs abrufen
async function loadJobs() {
  try {
    const res = await fetch(`${API_URL}/jobs`);
    if (!res.ok) throw new Error("Fehler beim Laden");
    const jobs = await res.json();

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
      } else if (job.status === "drucken") {
        actionButtonsHtml = `<button class="btn-tonal btn-success" onclick="setStatus(${job.id}, 'fertig')">Als fertig markieren</button>`;
      }

      row.innerHTML = `
        <div class="job-main">
          <div class="job-header">
            <span class="job-id">#${job.id}</span>
            <span class="job-file"></span>
            <span class="chip chip-${job.status}">${job.status}</span>
          </div>
          <div class="job-details">
            <span>Von: <strong class="job-name"></strong></span>
            <span>•</span>
            <span>Geschätzt: <strong>${job.estimatedTime} Min.</strong></span>
          </div>
        </div>

        <div class="job-actions">
          ${actionButtonsHtml}
          <button class="btn-icon-danger" onclick="removeJob(${job.id})" title="Auftrag löschen">Löschen</button>
        </div>
      `;

      // Sicherer Text-Eintrag (schützt vor Injections ohne escape-Funktion)
      row.querySelector(".job-file").textContent = job.fileName;
      row.querySelector(".job-name").textContent = job.name;

      queueList.appendChild(row);
    });

  } catch (err) {
    queueList.innerHTML = '<div class="empty-state error-text">Backend nicht erreichbar (Port 8000 prüfen).</div>';
  }
}

// 2. Neuen Job absenden (POST)
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

// 3. Status ändern (PATCH)
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

// 4. Job löschen (DELETE)
async function removeJob(jobId) {
  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}?jobId=${jobId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Löschen fehlgeschlagen");
    loadJobs();
  } catch (err) {
    alert(err.message);
  }
}

// Event-Listener für den Aktualisieren-Button & Initiales Laden
refreshBtn.addEventListener("click", loadJobs);
loadJobs();