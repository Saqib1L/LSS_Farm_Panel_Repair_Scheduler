import net from 'net';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'sources', 'statistics.json');

// Variables declaration
const PORT = 9000;
const HOST = '127.0.0.1';
let PanelData = [];
let updateTimer = null;

// Receiving data from the other file
const panels = new Map();
const grids = new Map();

// Inter Process Communication (IPC)
const server = net.createServer((socket) => {
  const rl = readline.createInterface({input: socket});

  rl.on('line', (line) => {
    const batch = JSON.parse(line); // Received 5000 items
    for (const item of batch) {
      // Validate & Update
      if(item.id !== undefined) {
        panels.set(item.id, item);
      };

      if(!updateTimer) {
        updateTimer = setTimeout(() => {
          const statisticsResult = calculateStatistics();
          updateData(statisticsResult);
          updateTimer = null;
        }, 1000);
      };
    };
  });
});

server.listen(PORT, HOST, () => console.log("[STATISTICS][RECEIVER]: Receiver is listening on port ", PORT));

// Updates the statistics.json
const updateData = async (statisticsData) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(statisticsData, null, 2));
  } catch (error) {
    console.error("[STATS]: ERROR WHILE UPDATING DATA: ", error);
  }
};

// Statistics calculation
const calculateStatistics = () => {
  grids.clear();
  panels.forEach((panel) => {
    // 1. Safe fallback (prevents crashes)
    let category = panel.val.maintenance_priority?.toLowerCase() || "none";

    // 2. GET
    let stats = grids.get(panel.val.zone);

    // 3. CHECK & SET (Initialize to 0, save to Map)
    if (!stats) {
      stats = {
        zone: panel.val.zone,
        total: 0,
        prior_none: 0,
        prior_low: 0,
        prior_med: 0,
        prior_high: 0,
        worst_panel: panel.val.id,
        worst_panel_eff: panel.val.efficiency,
        best_panel: panel.val.id,
        best_panel_eff: panel.val.efficiency,
        status: "",
        average: 0.00,
      };
      grids.set(panel.val.zone, stats);
    }
    
    stats.total = stats.total + 1;

    if(stats.total === 1) {
      stats.average = panel.val.efficiency;
    } else {
      stats.average = (stats.average*(stats.total-1)+panel.val.efficiency)/stats.total;
    }

    if (stats.average >= 90) stats.status = "Healthy";
    else if (stats.average >= 75) stats.status = "Minor Degradation";
    else if (stats.average >= 60) stats.status = "Moderate Degradation";
    else stats.status = "Severe Degradation";

    // Checking for best and worst panel
    if(stats.worst_panel_eff > panel.val.efficiency) {
      stats.worst_panel = panel.val.id;
      stats.worst_panel_eff = panel.val.efficiency;
    } else if(stats.best_panel_eff < panel.val.efficiency) {
      stats.best_panel = panel.val.id;
      stats.best_panel_eff = panel.val.efficiency;
    };
    
    // Checking into different category
    switch(category) {
      case "none":
        stats.prior_none++;
        break;
      case "low":
        stats.prior_low++;
        break;
      case "medium": 
        stats.prior_med++;
        break;
      case "high":
        stats.prior_high++;
        break;
      default:  
        break;
    };
  });

  return [...grids.values()];
};
