const panelGrid = document.getElementById('panelGrid');
const statsPanel = document.getElementById('statsPanel');
let zoneStream = null;

function openZoneStream(zoneId) {
  if (zoneStream) zoneStream.close();
  zoneStream = new EventSource(`http://localhost:3000/clicked/${zoneId}`);
  zoneStream.onmessage = (event) => {
    statsPanel.innerHTML = event.data;
    };
}

// Event delegation: one listener covers all 400 cells, and any future
// cells re-rendered by PanelGridView.render() work without rebinding.
panelGrid.addEventListener('click', (event) => {
  const cell = event.target.closest('.panel-grid__cell');
  if (!cell) return;
  openZoneStream(cell.dataset.zoneId);
});

panelGrid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const cell = event.target.closest('.panel-grid__cell');
  if (!cell) return;
  event.preventDefault();
  openZoneStream(cell.dataset.zoneId);
});

// Delegated close button lives inside server-streamed HTML, so it must
// be bound on the stable parent rather than the replaced innerHTML.
statsPanel.addEventListener('click', (event) => {
  if (!event.target.matches('.stats-panel__close')) return;
  if (zoneStream) zoneStream.close();
  statsPanel.innerHTML = '<p class="stats-panel__placeholder">Select a zone to view statistics</p>';
});



async function fetchMaintenanceQueue() {
  const response = await fetch('/maintenance-queue');
  const topPanels = await response.json();
  return topPanels;
}

function severityToStatus(severity) {
  if (severity === "Healthy") return "healthy";
  if (severity === "Minor Degradation") return "minor";
  if (severity === "Moderate Degradation") return "moderate";
  return "severe";
}

async function updateMaintenanceQueue() {
  const topPanels =  await fetchMaintenanceQueue();
  let htmlContent = "";

  topPanels.forEach((panel, index) => {
    htmlContent += renderMaintenanceItem(panel, index + 1);
  });

  document.getElementById('maintenanceQueueList').innerHTML = htmlContent;
}

function renderMaintenanceItem(panel, rank) {
  const status = severityToStatus(panel.severity);
  return `
    <div class="maintenance-item" data-panel-id="${panel.id}" tabindex="0" role="button">
      <span class="maintenance-item__rank">#${rank}</span>
      <span class="maintenance-item__id">Panel ${panel.id}</span>
      <span class="maintenance-item__efficiency" data-status="${status}">${panel.efficiency}%</span>
    </div>
  `;
}

updateMaintenanceQueue();
setInterval(updateMaintenanceQueue, 1000);