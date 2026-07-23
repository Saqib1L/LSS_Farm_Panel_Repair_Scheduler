const summaryHealthy               = document.getElementById('summaryHealthy');
const summaryMinor                 = document.getElementById('summaryMinor');
const summaryModerate              = document.getElementById('summaryModerate');
const summarySevere                = document.getElementById('summarySevere');
const summaryLoss                  = document.getElementById('summaryLoss');
const panelGrid                    = document.getElementById('panelGrid');
const statsPanel                   = document.getElementById('statsPanel');
const [closeButton1, closeButton2] = document.querySelectorAll('.close-button');
const repairFormView               = document.getElementById('repairModal');
const generateFormRepairButton     = document.getElementById('generateFormRepairButton');
const panelInputID                 = document.getElementById('panel-id-input');
const panelInputDescription        = document.getElementById('panel-desc-input');
const currentDegradationBar        = document.getElementById('currentDegradationBar');
const repairButton                 = document.querySelector('.repair-button');
const successMessageBox            = document.getElementById('success-toast');
const toastMessage                 = document.getElementById('toast-message');
const toastCloseButton             = document.getElementById('close-toast');
const LOSS_RATE_HEALTHY            = 0.00;
const LOSS_RATE_MINOR              = 0.50;
const LOSS_RATE_MODERATE           = 2.00;
const LOSS_RATE_SEVERE             = 5.00;
let   zoneStream                   = null;
let   fetchStream                  = null;
let   activeZone                   = null;
let   contentDisplayed             = false;
let   setDebounce                  = null;
const statisticsContent            = `
  <div class="stats-card">
    <div class="stats-card__header">
      <h2>Grid Information</h2>
      <span class="stat-label">Zone: <span id="grid_zone">--</span></span>
      <span id="panel_info_status" class="status-badge">--</span>
      <span class="stat-label">Time complexity: O(N)</span>
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
    <button id="close-btn-statistic-info" onclick="closeWindow(event)" class="stats-panel__close">
      ✖
    </button>
  </div>
`.replace(/\n/g, '').trim();
    // Removing newlines from the HTML string so it doesn't break the SSE format

const defaultContent = `
<p class="stats-panel__placeholder">Select a zone to view statistics</p>
`.replace(/\n/g, '').trim();

// ========= Functions ========= //
function calculateFarmSummary(data) {
  let totalHealthy = 0;
  let totalMinor = 0;
  let totalModerate = 0;
  let totalSevere = 0;

  for (let grid of data) {
    totalHealthy += grid.prior_none;
    totalMinor += grid.prior_low;
    totalModerate += grid.prior_med;
    totalSevere += grid.prior_high;
  }

  // I included Loss Rate for healthy even though it's equal to 0 (just for readibility and logical reasons)
  let totalLoss = (LOSS_RATE_HEALTHY * totalHealthy) 
                + (LOSS_RATE_MINOR * totalMinor) 
                + (LOSS_RATE_MODERATE * totalModerate) 
                + (LOSS_RATE_SEVERE * totalSevere);

  return {
    healthy: totalHealthy,
    minor: totalMinor,
    moderate: totalModerate,
    severe: totalSevere,
    loss: totalLoss
  };
}

async function populateFarmSummary(data) {
  const totals = calculateFarmSummary(data);
  summaryHealthy.innerText  = totals.healthy;
  summaryMinor.innerText    = totals.minor;
  summaryModerate.innerText = totals.moderate;
  summarySevere.innerText   = totals.severe;
  summaryLoss.innerText     = `RM ${totals.loss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Updating stats information 
function updateStatsInformation(grid) {
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
  gridInfoTotal.innerText     = `${grid.total}`;
  gridInfoHealthy.innerText   = `${grid.prior_none}`;
  gridInfoMinor.innerText     = `${grid.prior_low}`;
  gridInfoModerate.innerText  = `${grid.prior_med}`;
  gridInfoSevere.innerText    = `${grid.prior_high}`;
  gridWorstPanel.innerText    = `${grid.worst_panel}`;
  gridWorstPanelEff.innerText = `${grid.worst_panel_eff}`;
  gridBestPanel.innerText     = `${grid.best_panel}`;
  gridBestPanelEff.innerText  = `${grid.best_panel_eff}`;
  gridInfoStatus.innerText    = `${grid.status}`;
  gridInfoAvg.innerText       = `${grid.average.toFixed(3)}`;
  gridZone.innerText          = `${grid.zone}`;
}

// Fetching grids information from server.js (BACKEND)
function fetchGrids() {
  if(fetchStream) fetchStream.close();
  fetchStream = new EventSource("http://localhost:3000/retrieve-grids");
  fetchStream.onmessage = (event) => {
    const data = JSON.parse(event.data);
    for(let grid of data) {
      document.getElementById(`${grid.zone}`).setAttribute('data-status', `${grid.status}`);
      if(contentDisplayed && grid.zone === activeZone) {
        updateStatsInformation(grid);
      }
    }
    populateFarmSummary(data);
  }
  fetchStream.onerror = () => {
    fetchStream.close();
    setTimeout(fetchGrids, 500);
  };
}

// Open pop-up form
function openPopupForm() {
  panelInputID.value              = "";
  panelInputDescription.innerText = "";
  currentDegradationBar.innerText = "No panel found";
  repairFormView.classList.toggle('close-popup-form', false);
}

// Close button for pop-up form
function closePopupForm() {
  repairFormView.classList.toggle('close-popup-form', true);
}

// Successfull message popup
function showMessage(panelId) {
  successMessageBox.classList.toggle('show', true);
  toastMessage.innerText = `Panel SP${String(panelId).padStart(7, '0')} has successfully been repaired`;
};

function closeMessage() { successMessageBox.classList.toggle('show', false) };

// Close button callback to close the stats window (UI)
function closeWindow(event) {
  if (!event.target.matches('.stats-panel__close')) return;
  if (zoneStream) zoneStream.close();
  statsPanel.innerHTML = defaultContent;
};
// As the js script type set to module, it is necessary to keep the onlick attribute working
window.closeWindow = closeWindow;

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
  const status                = severityToStatus(panel.severity);
  const maintenanceRank       = document.getElementById(`maintenance_rank_id_${rank}`);
  const maintenancePanelID    = document.getElementById(`maintenance_panel_id_${rank}`);
  const maintenanceEfficiency = document.getElementById(`maintenance_efficiency_id_${rank}`);
  maintenanceEfficiency.setAttribute('data-status', `${status}`);
  maintenanceRank.innerText       = `#${rank}`;
  maintenancePanelID.innerText    = `Panel ${panel.id}`;
  maintenanceEfficiency.innerText = `${panel.efficiency}%`;
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

let maintenanceIntervalId = null;

function startMaintenancePolling() {
  if (maintenanceIntervalId) return;
  updateMaintenanceQueue();
  maintenanceIntervalId = setInterval(updateMaintenanceQueue, 1000);
}

function stopMaintenancePolling() {
  if (maintenanceIntervalId) {
    clearInterval(maintenanceIntervalId);
    maintenanceIntervalId = null;
  }
}

function startProgram() {
  generateTemplate();
  fetchGrids();
  startMaintenancePolling();
}

// Pause polling & SSE when the tab is hidden, resume when visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopMaintenancePolling();
    if (fetchStream) fetchStream.close();
  } else {
    fetchGrids();
    startMaintenancePolling();
  }
});


// ========= Add Event Listiner ========= //
// Clicking on panel grid to reveal the window of grids stats
panelGrid.addEventListener('click', (event) => {
  const cell = event.target.closest('.panel-grid__cell');
  if (!cell) return;
  if(!contentDisplayed) {
    statsPanel.innerHTML = statisticsContent;
    contentDisplayed = !contentDisplayed;
  }
  activeZone = cell.dataset.zoneId;
});

panelGrid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const cell = event.target.closest('.panel-grid__cell');
  if (!cell) return;
  event.preventDefault();
});

// Delegated close button lives inside server-streamed HTML, so it must
// be bound on the stable parent rather than the replaced innerHTML.
statsPanel.addEventListener('click', (event) => {
  if (!event.target.matches('.stats-panel__close')) return;
  if (zoneStream) zoneStream.close();
  contentDisplayed = !contentDisplayed;
});

generateFormRepairButton.addEventListener('click', () => openPopupForm());

closeButton1.addEventListener('click', () => closePopupForm());
closeButton2.addEventListener('click', () => closePopupForm());

// Retrieving input from html tag input and fetching the data from back-end
panelInputID.addEventListener('input', () => {
  if(setDebounce) {
    clearTimeout(setDebounce);
  };
  let userInput = !panelInputID.value ? '-' : panelInputID.value > 0 ? panelInputID.value : '-';
  setDebounce = setTimeout(async () => {
    try {
      console.log(`INPUT VAL: ${panelInputID.value}`);
      const response = await fetch(`/api/repair-panel/${userInput}`);
      if(response.ok) {
        const panelData = await response.json();
        repairButton.disabled = false;
        if(panelData.error) {
          currentDegradationBar.innerText = "No panel found";
          repairButton.disabled = true;
          throw new Error();
        }
        currentDegradationBar.innerText = `${panelData.efficiency}% - ${panelData.severity}`;
        return;
      };
    }
    catch(error) {
      console.log(`ERROR: panel not found`);
    }
  }, 600);
});

// Initiate repair
repairButton.addEventListener('click', async () => {
  try {
    const response = await fetch(`/api/fix-panel/${panelInputID.value}`);
    closePopupForm(panelInputID.value);
    showMessage(parseInt((panelInputID.value).replace(/\D/g, '')));
    // console.log(await response.json());
  } catch (error) {
    console.log("Error: ", error);
  }
});

// Close message popup box
toastCloseButton.addEventListener('click', () => {
  closeMessage();
});

startProgram();