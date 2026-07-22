import net from 'net';
import readline from 'readline';
let PanelData = [];

import fs from 'fs/promises';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '..', 'sources', 'data.json');
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

const totalData = 200000;

// Connection properties for streaming data
const PORT_FOR_STATISTIC = 9000;
const PORT_FOR_RANK_PANEL = 9001;
const PORT_FOR_REPAIR = 9002;
const HOST = '127.0.0.1';
let client_statistic;
let client_ranking;
let client_repair;

// Connect to statistics functions 
const connectToStatistic = () => {
  client_statistic = new net.Socket();
  // Error checking
  client_statistic.on('error', (err) => {
    if(err.code === "ECONNREFUSED") {
      console.log("[PANEL_SIMULATION][SENDER][TARGET: STATS]: Receiver not ready yet. Retrying in 1 second...");
      setTimeout(connectToStatistic, 1000);
    };
  });

  client_statistic.on('connect', () => {
    console.log("[PANEL_SIMULATION][SENDER][TARGET: STATS]: The connection is open on port ", PORT_FOR_STATISTIC);
  });

  // Close connection
  client_statistic.on('close', () => {
    console.log("[PANEL_SIMULATION][SENDER][TARGET: STATS]: The connection is closed");
  });

  // Trigger connection
  client_statistic.connect(PORT_FOR_STATISTIC, HOST);
};

// Connect to rank panel functions
const connectToRanking = () => {
  client_ranking = new net.Socket();

  client_ranking.on('error', (err) => {
    if(err.code === "ECONNREFUSED") {
      console.log("[PANEL_SIMULATION][SENDER][TARGET: RANKS]: Receiver not ready yet. Retrying in 1 second...");
      setTimeout(connectToRanking, 1000);
    };
  });

  client_ranking.on('connect', () => {
    console.log("[PANEL_SIMULATION][SENDER][TARGET: RANKS]: The connection is open on port ", PORT_FOR_RANK_PANEL);
  });

  // Close connection
  client_ranking.on('close', () => {
    console.log("[PANEL_SIMULATION][SENDER][TARGET: RANKS]: The connection is closed");
  });

  // Trigger connection
  client_ranking.connect(PORT_FOR_RANK_PANEL, HOST);
}

// Connect to repair panel functions
const connectToRepair = net.createServer((socket) => {
  const rl = readline.createInterface({ input: socket });
  rl.on('line', (line) => {
    try {
      const { action, id } = JSON.parse(line);
      if (action === 'fix' && id) {
        const parsedId = parseInt(id.replace(/\D/g, ''));
        if (PanelData[parsedId - 1]) {
          PanelData[parsedId - 1].efficiency = 100;
          PanelData[parsedId - 1].severity = "Healthy";
          PanelData[parsedId - 1].maintenance_priority = "None";
          socket.write(JSON.stringify({ ok: true, panel: PanelData[parsedId - 1] }) + '\n');
          return;
        }
      }
      if (action === 'lookup' && id) {
        const parsedId = parseInt(id.replace(/\D/g, ''));
        if (PanelData[parsedId - 1]) {
          socket.write(JSON.stringify({ ok: true, panel: PanelData[parsedId - 1] }) + '\n');
          return;
        }
      }
      socket.write(JSON.stringify({ ok: false, error: "Panel not found" }) + '\n');
    } catch {
      socket.write(JSON.stringify({ ok: false, error: "Bad request" }) + '\n');
    }
  });
});

if (isMainModule) {
  connectToRepair.listen(PORT_FOR_REPAIR, HOST, () => {
    console.log("[PANEL_SIMULATION][FIX_LISTENER]: Listening on port ", PORT_FOR_REPAIR);
  });
}

// Sending data to statistics.js
const sendStreamData = () => {
  let batch = [];
  PanelData.forEach((panel) => {
    batch.push({
      id: panel.id,
      val: panel
    });

    if(batch.length === totalData/40) {
      if(!client_statistic.pending) client_statistic.write(JSON.stringify(batch) + '\n');
      if(!client_ranking.pending) client_ranking.write(JSON.stringify(batch) + '\n');
      batch = [];
    };
  });
};



// Retrieve data from data.json
const readData = async () => {
  // File validation checking
  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    if(!rawData.trim()) {
      return [];
    }
    return JSON.parse(rawData);
  } catch (error) {
    if(error.code === "ENOENT") {
      console.log("[SERVER][SENDER][TARGET: STATS]: The data.json does not exists, the program is creating one...");
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
  }
}

PanelData = await readData();

// Preventing program crash
PanelData = PanelData ?? [];

const AGEING_RATE = 0.002;

function randomizeDroppingPercentage(min, max) {
  return Math.random()*(max-min) + min;
}

function randomizeDropPercentage(probability) {
  let randomNum = Math.random()*100.1;
  randomNum = Math.min(randomNum, 100);
  if(probability == 0.1 && randomNum <= probability) {
    return randomizeDroppingPercentage(50, 100);
  }
  else if (probability == 5.9 && randomNum <= probability) {
    return randomizeDroppingPercentage(10, 50);
  }
  else if (probability == 14 && randomNum <= probability) {
    return randomizeDroppingPercentage(1, 10)
  }
  else if (probability == 80 && randomNum <= probability) {
    return randomizeDroppingPercentage(0, 1);
  }
  else {
    return 0;
  }
}

function simulateDegradationFactors(panel) {
  if (Math.random() > 0.0045) { 
    return;
  }
  let oldEfficiency = panel.efficiency;

  // Weather/thermal wobble, routine dust settlin — small daily noise
  let routineDisturbanceDropPrcntge = randomizeDropPercentage(80);

  // Meaningful dust/soiling buildup, a hotter-than-usual day
  let meaningfulDisturbanceDropPrcntge = randomizeDropPercentage(14);
  
  // An actual equipment fault — wiring, inverter, hotspot
  let equipmentFaultDropPrcntge = randomizeDropPercentage(5.9);
  
  // Catastrophic event — storm damage, major fault, physical damage
  let catastrophicEventDropPrcntge = randomizeDropPercentage(0.1);

  let newEfficiency = oldEfficiency - (AGEING_RATE + routineDisturbanceDropPrcntge + meaningfulDisturbanceDropPrcntge + equipmentFaultDropPrcntge + catastrophicEventDropPrcntge);

  newEfficiency = Math.max(0, newEfficiency);

  //Rounds efficiency to 3 decimal places.
  newEfficiency = Math.round(newEfficiency * 1000) / 1000;

  const {severity, maintenance_priority} = classifyEfficiency(newEfficiency);
  panel.efficiency = newEfficiency;
  panel.severity = severity;
  panel.maintenance_priority = maintenance_priority;
}

// Classifies panel severity based on efficiency
function classifyEfficiency(efficiency) {
  if (efficiency >= 90) return {severity: "Healthy", maintenance_priority: "None"};
  if (efficiency >= 75) return {severity: "Minor Degradation", maintenance_priority: "Low"};
  if (efficiency >= 60) return {severity: "Moderate Degradation", maintenance_priority: "Medium"};
  return {severity: "Severe Degradation", maintenance_priority: "High"};
}

const TICK_INTERVAL_MS = 1000;
let tickCount = 0;

function runSimulation() {

  console.log(`[SIM] Loaded ${PanelData.length} panels. Starting...`);

  setInterval(async function tick() {
    tickCount++;

    for (const panel of PanelData) {
      simulateDegradationFactors(panel);
    }

    await updateData();
    
    const counts = { Healthy: 0, "Minor Degradation": 0, "Moderate Degradation": 0, "Severe Degradation": 0 };
      for (const panel of PanelData) {
        counts[panel.severity]++;
      }
      // console.log(`[SIM] Day ${tickCount}:`, counts);
    
    // Calling send data function
    sendStreamData();
  }, TICK_INTERVAL_MS);
}

const updateData = async () => {
  await fs.writeFile(filePath, JSON.stringify(PanelData, null, 2));
};

if (isMainModule) {
  connectToStatistic();
  connectToRanking();
  runSimulation();
}
