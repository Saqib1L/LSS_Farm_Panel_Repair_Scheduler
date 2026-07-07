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

let dataArray = await readData();

const updateData = async () => {
  await fs.writeFile(filePath, JSON.stringify(dataArray, null, 2));
};

// Generating 200k data 
const generateData = () => {
  let capacityReseter = 1;
  let gridZoneRow = 1;
  let gridZoneCol = 1;

  for(let i=0; i<totalData; i++) {
    if(capacityReseter === 501) {
      capacityReseter = 1;
      gridZoneCol++;
    }

    if(gridZoneCol === 21) {
      gridZoneCol = 1;
      gridZoneRow++;
    }
    
    dataArray.push({
      "id": `SP${String(i+1).padStart(7, '0')}`,
      "efficiency": 100.00,
      "severity": "Healthy",
      "maintenance_priority": "None",
      "zone": `ZONE-R${gridZoneRow}-C${gridZoneCol}`
    });
    capacityReseter++;
  }

  updateData();
}

try {
  await generateData();
  console.log("[SERVER]: The data has been generated and updated to data.json.");
} catch (error) {
  console.log("[ERROR]: ", error);
}