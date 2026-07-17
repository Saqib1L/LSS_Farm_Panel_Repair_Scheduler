const panelGrid         = document.getElementById('panelGrid');
const statsPanel        = document.getElementById('statsPanel');
let zoneStream = null;
let contentDisplayed = false;
const statisticsContent = `
  <div class="stats-card">
    <div class="stats-card__header">
      <h2>Grid Information</h2>
      <span class="stat-label">Zone: <span id="grid_zone">--</span></span>
      <span id="panel_info_status" class="status-badge">--</span>
    </div>

    <div class="stats-card__overview">
      <div class="stat-box">
        <span class="stat-label">Total Panels</span>
        <strong id="panel_info_total" class="stat-value">--</strong>
      </div>
      <div class="stat-box">
        <span class="stat-label">Grid Average</span>
        <strong id="panel_info_avg" class="stat-value">--</strong>
      </div>
    </div>

    <h3 class="stats-card__subtitle">Health Breakdown</h3>
    <div class="stats-card__health-grid">
      <div class="health-item healthy">
        <span class="stat-label">Healthy</span>
        <span id="panel_info_healthy" class="health-value">--</span>
      </div>
      <div class="health-item minor">
        <span class="stat-label">Minor</span>
        <span id="panel_info_minor_degradated" class="health-value">--</span>
      </div>
      <div class="health-item moderate">
        <span class="stat-label">Moderate</span>
        <span id="panel_info_moderate_degradated" class="health-value">--</span>
      </div>
      <div class="health-item severe">
        <span class="stat-label">Severe</span>
        <span id="panel_info_severe_degradated" class="health-value">--</span>
      </div>
    </div>

    <h3 class="stats-card__subtitle">Performance Extremes</h3>
    <div class="stats-card__extremes">
      <div class="extreme-box best">
        <span class="stat-label">Best Panel: <span id="panel_info_best_panel">--</span></span>
        <strong class="stat-value"><span id="panel_info_best_panel_eff">--</span>%</strong>
      </div>
      <div class="extreme-box worst">
        <span class="stat-label">Worst Panel: <span id="panel_info_worst_panel">--</span></span>
        <strong class="stat-value"><span id="panel_info_worst_panel_eff">--</span>%</strong>
      </div>
    </div>
    <button id="close-btn-statistic-info" onClick="closeWindow(event)" class="stats-panel__close">
      ✖
    </button>
  </div>
`.replace(/\n/g, '').trim();
    // Removing newlines from the HTML string so it doesn't break the SSE format

const defaultContent = `
<p class="stats-panel__placeholder">Select a zone to view statistics</p>
`.replace(/\n/g, '').trim();

function openZoneStream(zoneId) {
  const gridInfoTotal     = document.getElementById('panel_info_total');
  const gridInfoHealthy   = document.getElementById('panel_info_healthy');
  const gridInfoMinor     = document.getElementById('panel_info_minor_degradated');
  const gridInfoModerate  = document.getElementById('panel_info_moderate_degradated');
  const gridInfoSevere    = document.getElementById('panel_info_severe_degradated');
  const gridWorstPanel    = document.getElementById('panel_info_worst_panel');
  const gridWorstPanelEff = document.getElementById('panel_info_worst_panel_eff');
  const gridBestPanel     = document.getElementById('panel_info_best_panel');
  const gridBestPanelEff  = document.getElementById('panel_info_best_panel_eff');
  const gridInfoStatus    = document.getElementById('panel_info_status');
  const gridInfoAvg       = document.getElementById('panel_info_avg');
  const gridZone          = document.getElementById('grid_zone');
  if (zoneStream) zoneStream.close();
  zoneStream = new EventSource(`http://localhost:3000/clicked/${zoneId}`);
  zoneStream.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // statsPanel.innerHTML = event.data;
    gridInfoTotal.innerText     = `${data.total}`;
    gridInfoHealthy.innerText   = `${data.prior_none}`;
    gridInfoMinor.innerText     = `${data.prior_low}`;
    gridInfoModerate.innerText  = `${data.prior_med}`;
    gridInfoSevere.innerText    = `${data.prior_high}`;
    gridWorstPanel.innerText    = `${data.worst_panel}`;
    gridWorstPanelEff.innerText = `${data.worst_panel_eff}`;
    gridBestPanel.innerText     = `${data.best_panel}`;
    gridBestPanelEff.innerText  = `${data.best_panel_eff}`;
    gridInfoStatus.innerText    = `${data.status}`;
    gridInfoAvg.innerText       = `${data.average.toFixed(3)}`;
    gridZone.innerText          = `${data.zone}`;
  };
}

// Event delegation: one listener covers all 400 cells, and any future
// cells re-rendered by PanelGridView.render() work without rebinding.
panelGrid.addEventListener('click', (event) => {
  if(!contentDisplayed) {
    statsPanel.innerHTML = statisticsContent;
    contentDisplayed = !contentDisplayed;
  }
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
  contentDisplayed = !contentDisplayed;
});


function closeWindow(event) {
  if (!event.target.matches('.stats-panel__close')) return;
  if (zoneStream) zoneStream.close();
  statsPanel.innerHTML = defaultContent;
};

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
  
  topPanels.forEach((panel, index) => {
    renderMaintenanceItem(panel, index+1);
  });
}

function renderMaintenanceItem(panel, rank) {
  const status = severityToStatus(panel.severity);
  const maintenanceRank = document.getElementById(`maintenance_rank_id_${rank}`);
  const maintenancePanelID = document.getElementById(`maintenance_panel_id_${rank}`);
  const maintenanceEfficiency = document.getElementById(`maintenance_efficiency_id_${rank}`);
  maintenanceEfficiency.setAttribute('data-status', `${status}`);
  maintenanceRank.innerText = `#${rank}`;
  maintenancePanelID.innerText = `Panel ${panel.id}`;
  maintenanceEfficiency.innerText = `${panel.efficiency}%`;
  
  // return `
  //   <div class="maintenance-item" data-panel-id="${panel.id}" tabindex="0" role="button">
  //     <span class="maintenance-item__rank">#${rank}</span>
  //     <span class="maintenance-item__id">Panel ${panel.id}</span>
  //     <span class="maintenance-item__efficiency" data-status="${status}">${panel.efficiency}%</span>
  //     </div>
  //     `;

}
    
function generateTemplate() {
  const maintenanceQueueList = document.getElementById('maintenanceQueueList');
  let htmlContent = "";
  for(let i=0;i<30;i++) {
    htmlContent += `
    <div class="maintenance-item" tabindex="0" role="button">
      <span class="maintenance-item__rank" id="maintenance_rank_id_${i+1}"></span>
      <span class="maintenance-item__id" id="maintenance_panel_id_${i+1}"></span>
      <span class="maintenance-item__efficiency" id="maintenance_efficiency_id_${i+1}"></span>
    </div>
    `;
  }
  maintenanceQueueList.innerHTML = htmlContent;

  htmlContent = "";
  let ROW = 1;
  let COL = 1;
  for(let i=0;i<400;i++) {
    htmlContent += `
      <div id="ZONE-R${ROW}-C${COL}" class="panel-grid__cell" data-row="0" data-col="0" data-zone-id="ZONE-R${ROW}-C${COL}" tabindex="0" role="button" aria-label="Zone R${ROW}-C${COL}">
      </div>
    `;
    if(COL >= 20) {
      COL = 0;
      ROW++;
    }
    COL++;
  }

  panelGrid.innerHTML = htmlContent;
}

generateTemplate();
updateMaintenanceQueue();
setInterval(updateMaintenanceQueue, 1000);