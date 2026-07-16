const panelGrid         = document.getElementById('panelGrid');
const statsPanel        = document.getElementById('statsPanel');
let zoneStream = null;
let contentDisplayed = false;
const statisticsContent = `
  <div class="profile-card">
    <h2>Grid informations: </h2>
    <p id="panel_info_total"></p>
    <p id="panel_info_healthy"></p>
    <p id="panel_info_minor_degradated"></p>
    <p id="panel_info_moderate_degradated"></p>
    <p id="panel_info_severe_degradated"></p>
    <p id="panel_info_worst_panel"></p>
    <p id="panel_info_worst_panel_eff"></p>
    <p id="panel_info_best_panel"></p>
    <p id="panel_info_best_panel_eff"></p>
    <p id="panel_info_status"></p>
    <p id="panel_info_avg"></p>
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
  if (zoneStream) zoneStream.close();
  zoneStream = new EventSource(`http://localhost:3000/clicked/${zoneId}`);
  zoneStream.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // statsPanel.innerHTML = event.data;
      gridInfoTotal.innerText     = `Total: ${data.total}`;
      gridInfoHealthy.innerText   = `Healthy: ${data.prior_none}`;
      gridInfoMinor.innerText     = `Minor: ${data.prior_low}`;
      gridInfoModerate.innerText  = `Moderate: ${data.prior_med}`;
      gridInfoSevere.innerText    = `Severe: ${data.prior_high}`;
      gridWorstPanel.innerText    = `Worst panel: ${data.worst_panel}`;
      gridWorstPanelEff.innerText = `Worst panel %:${data.worst_panel_eff}`;
      gridBestPanel.innerText     = `Best panel: ${data.best_panel}`;
      gridBestPanelEff.innerText  = `Best panel %: ${data.best_panel_eff}`;
      gridInfoStatus.innerText    = `Grid status: ${data.status}`;
      gridInfoAvg.innerText       = `Average %: ${data.average}`;
  };
}

// Event delegation: one listener covers all 400 cells, and any future
// cells re-rendered by PanelGridView.render() work without rebinding.
panelGrid.addEventListener('click', (event) => {
  if(!contentDisplayed) {
    statsPanel.innerHTML = statisticsContent;
    contentDisplayed = true;
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
  statsPanel.innerHTML = defaultContent;
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
  
  topPanels.forEach((panel, index) => {
    renderMaintenanceItem(panel, index+1);
  });
  // let htmlContent = "";

  // topPanels.forEach((panel, index) => {
  //   htmlContent += renderMaintenanceItem(panel, index + 1);
  // });

  // document.getElementById('maintenanceQueueList').innerHTML = htmlContent;
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
}

generateTemplate();
updateMaintenanceQueue();
setInterval(updateMaintenanceQueue, 1000);