let PanelData = [];

import fs from 'fs/promises';
const filePath = "../data.json";
const totalData = 200000;

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
      console.log("[SERVER]: The data.json does not exists, the program is creating one...");
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
  }
}

PanelData = await readData();


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
  else if (probability <= 5.9 && randomNum <= probability) {
    return randomizeDroppingPercentage(10, 50);
  }
  else if (probability == 14 && randomNum <= probability) {
    return randomizeDroppingPercentage(1, 10)
  }
  else if (probability == 80 && randomNum <= probability) {
    return randomizeDroppingPercentage(0, 1);
  }
  else {
    return "Invalid";
  }
}

function simulateDegradationFactors(oldEfficiency) {
  // Weather/thermal wobble, routine dust settlin — small daily noise
  let routineDisturbanceDropPrcntge = randomizeDropPercentage(80);
  
  // Meaningful dust/soiling buildup, a hotter-than-usual day
  let meaningfulDisturbanceDropPrcntge = randomizeDropPercentage(14);
  
  // An actual equipment fault — wiring, inverter, hotspot
  let equipmentFaultDropPrcntge = randomizeDropPercentage(5.9);
  
  // Catastrophic event — storm damage, major fault, physical damage
  let catastrophicEventDropPrcntge = randomizeDropPercentage(0.1);

  let newEfficiency = oldEfficiency - (AGEING_RATE + routineDisturbanceDropPrcntge + meaningfulDisturbanceDropPrcntge + equipmentFaultDropPrcntge + catastrophicEventDropPrcntge);

  return newEfficiency;
}
