import { read } from 'fs';
import fs from 'fs/promises';
const filePath = "../data.json";

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
};

let panels = readData();

let topThirtyWorst = [];

