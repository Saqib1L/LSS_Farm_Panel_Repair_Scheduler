//Pull JSON data into a JavaScript Property/Struct
let PanelData = [];

import fs from 'fs/promises';
const filePath = "../data.json";
const totalData = 200000;

const readData = async () => {
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

function simulateExternalFactors() {

  // Weather/thermal wobble, routine dust settling — small daily noise
  let routineDisturbanceChance = 0;

  // Meaningful dust/soiling buildup, a hotter-than-usual day
  let intenseDisturbanceChance = 0;

  // An actual equipment fault — wiring, inverter, hotspot
  let equpmentFaultChance = 0;

  // Catastrophic event — storm damage, major fault, physical damage
  let suddenCatastrophyChance = 0;

  
}