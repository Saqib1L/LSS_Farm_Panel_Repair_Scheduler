import { read } from 'fs';
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
    }
  }
}

let dataArray = await readData();

const updateData = async () => {
  await fs.writeFile(filePath, JSON.stringify(dataArray, null, 2));
};

// Generating 200k data 
const generateData = async () => {
  let capacityReseter = 1;
  let gridZones = 1;

  for(let i=0; i<totalData; i++) {
    if(capacityReseter === 501) {
      capacityReseter = 1;
      gridZones++;
    }
    await dataArray.push({
      "id": `SP${String(i+1).padStart(7, '0')}`,
      "efficiency": 100.00,
      "severity": "Healthy",
      "maintenance_priority": "None",
      "zone": `Z-${gridZones}`
    });
    capacityReseter++;
  }

  await updateData();
}

generateData();
console.log(dataArray);