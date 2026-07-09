import net from 'net';
import readline from 'readline';

// Variables declaration
const PORT = 9000;
const HOST = '127.0.0.1';

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
      }
    }
  });
});

server.listen(PORT, HOST, () => console.log("[SERVER]: Receiver is listening on port ", PORT));

// Statistics calculation
panels.forEach((panel) => {
  let category = panel.maintenance_priority.toLowerCase();
  let stats = grids.set(panel.zone) || {
    zone: panel.zone,
    total: 0,
    prior_none: 0,
    prior_low: 0,
    prior_med: 0,
    prior_high: 0,
    worst_panel: panel.id,
    worst_panel_eff: panel.efficiency,
    best_panel: panel.id,
    best_panel_eff: panel.efficiency,
    status: "",
    average: 0.00,
  };
  stats.total++;
  if(average === 0.00) {
    average += panel.efficiency;
  } else {
    average = (average*(stats.total-1)+panel.efficiency)/stats.total;
  };

  if (average >= 90) stats.status = "Healthy";
  else if (average >= 75) stats.status = "Minor Degradation";
  else if (average >= 60) stats.status = "Moderate Degradation";
  else stats.status = "Severe Degradation";

  // Checking for best and worst panel
  if(stats.worst_panel_eff > panel.efficiency) {
    stats.worst_panel = panel.id;
    stats.worst_panel_eff = panel.efficiency;
  } else if(stats.best_panel_eff < panel.efficiency) {
    stats.best_panel = panel.id;
    stats.best_panel_eff = panel.efficiency;
  };
  
  // Checking into different category
  switch(category) {
    case "healthy":
      prior_none++;
      break;
    case "low":
      prior_low++;
      break;
    case "medium": 
      prior_med++;
      break;
    case "high":
      prior_high++;
      break;
    default:
      break;
  };
});

