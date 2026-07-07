import fs from 'fs/promises';

const filePath = "../data.json";

// 1 tick = 1 simulated day. Lower this to speed the whole simulation up.
const TICK_INTERVAL_MS = 1000;

// ---- Real-world-inspired degradation parameters ----

// Aging: crystalline-silicon panels realistically lose ~0.5-0.8%/year,
// permanently. Converted to a %/day rate, randomized per panel since real
// panels don't all age identically.
const AGING_RATE_MIN = 0.5 / 365;
const AGING_RATE_MAX = 0.8 / 365;

// Soiling/dust: builds up daily until cleaned, commonly ~0.2-0.5%/day loss.
// Capped because dust buildup naturally plateaus rather than climbing
// forever. A maintenance visit (maintainPanel) clears it.
const DUST_RATE_MIN = 0.05;
const DUST_RATE_MAX = 0.35;
const DUST_CAP = 10;

// Faults: rare, sudden equipment issues (inverter, wiring, hotspots).
// Persists until a maintenance visit repairs it.
const FAULT_PROBABILITY_PER_DAY = 0.0006;
const FAULT_PENALTY_MIN = 10;
const FAULT_PENALTY_MAX = 35;

// Weather/thermal noise: short-term variance, resets every tick (not cumulative).
const NOISE_STDDEV = 0.3;

function classify(efficiency) {
  if (efficiency >= 90) return { severity: "Healthy", maintenance_priority: "None" };
  if (efficiency >= 75) return { severity: "Minor Degradation", maintenance_priority: "Low" };
  if (efficiency >= 60) return { severity: "Moderate Degradation", maintenance_priority: "Medium" };
  return { severity: "Severe Degradation", maintenance_priority: "High" };
}

function gaussianNoise(stddev) {
  // Box-Muller transform for a normally-distributed random value
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * stddev;
}

// Backfills the hidden simulation state the first time a panel is seen,
// so this script works fine against data.json exactly as DataGenScript.js
// produced it (no aging/dust/fault fields yet).
function ensureSimState(panel) {
  if (panel.agingRate === undefined) {
    panel.agingRate = AGING_RATE_MIN + Math.random() * (AGING_RATE_MAX - AGING_RATE_MIN);
  }
  if (panel.dustRate === undefined) {
    panel.dustRate = DUST_RATE_MIN + Math.random() * (DUST_RATE_MAX - DUST_RATE_MIN);
  }
  if (panel.dustLoss === undefined) panel.dustLoss = 0;
  if (panel.agingLoss === undefined) panel.agingLoss = 0;
  if (panel.faultPenalty === undefined) panel.faultPenalty = 0;
}

function simulateTick(panel) {
  ensureSimState(panel);

  // Permanent, never recovers on its own.
  panel.agingLoss += panel.agingRate;

  // Accumulates daily, plateaus at the cap.
  panel.dustLoss = Math.min(DUST_CAP, panel.dustLoss + panel.dustRate);

  // Rare one-off event; won't stack faults on top of an existing one.
  if (panel.faultPenalty === 0 && Math.random() < FAULT_PROBABILITY_PER_DAY) {
    panel.faultPenalty = FAULT_PENALTY_MIN + Math.random() * (FAULT_PENALTY_MAX - FAULT_PENALTY_MIN);
  }

  const noise = gaussianNoise(NOISE_STDDEV);
  let efficiency = 100 - panel.agingLoss - panel.dustLoss - panel.faultPenalty + noise;
  efficiency = Math.max(0, Math.min(100, efficiency));
  efficiency = Math.round(efficiency * 10) / 10;

  panel.efficiency = efficiency;
  const { severity, maintenance_priority } = classify(efficiency);
  panel.severity = severity;
  panel.maintenance_priority = maintenance_priority;
}

// Call when a maintenance crew services a panel: clears soiling and repairs
// faults, but does NOT undo aging — real cleaning/repairs don't make a
// panel younger. Wire this up to your top-30 maintenance queue later.
export function maintainPanel(panel) {
  panel.dustLoss = 0;
  panel.faultPenalty = 0;
}

let dataArray = [];
let tickCount = 0;

async function loadData() {
  const raw = await fs.readFile(filePath, 'utf8');
  dataArray = JSON.parse(raw);
}

async function saveData() {
  await fs.writeFile(filePath, JSON.stringify(dataArray, null, 2));
}

async function runSimulation() {
  await loadData();
  console.log(`[SIM] Loaded ${dataArray.length} panels. 1 tick = 1 simulated day, every ${TICK_INTERVAL_MS}ms.`);

  setInterval(async () => {
    tickCount++;
    for (const panel of dataArray) {
      simulateTick(panel);
    }

    // Writing all 200,000 panels to disk every tick is expensive — save
    // every 5 ticks instead. Once server.js holds this array in memory
    // directly, this file-based save step can go away entirely.
    if (tickCount % 5 === 0) {
      await saveData();
      const counts = { "Healthy": 0, "Minor Degradation": 0, "Moderate Degradation": 0, "Severe Degradation": 0 };
      for (const p of dataArray) counts[p.severity]++;
      console.log(`[SIM] Day ${tickCount} saved:`, counts);
    }
  }, TICK_INTERVAL_MS);
}

runSimulation();