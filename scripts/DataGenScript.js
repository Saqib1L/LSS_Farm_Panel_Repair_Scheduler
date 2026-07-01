import { read } from 'fs';
import fs from 'fs/promises';
const filePath = "./data.json";

const readData = async () => {
  const rawData = await fs.readFile(filePath, 'utf8');
  return JSON.parse(rawData);
}

let dataArray = await readData();

const updateData = async () => {
  await fs.writeFile(filePath, JSON.stringify(dataArray, null, 2));
};

// Generating 200k data 
const generateData = async () => {

  for(let i=0; i<199999; i++) {
    await dataArray.push({
      "id": `SP${String(i+1).padStart(7, '0')}`,
      "efficiency": 100.00,
      "severity": "Healthy",
      "maintenance_priority": "None"
    });
  }

  await updateData();
}

generateData();
console.log(dataArray);