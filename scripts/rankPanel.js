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

let panels = await readData();
let sortedPanels = [...panels];
let totalPanels = sortedPanels.length;

const worstPanelLimit = 30; 

// partial bubble sort

for (let i = 0; i < worstPanelLimit && i < totalPanels; i++) {
  let swapped = false;
  
  for (let j = totalPanels - 1; j > i; j--) {
    
    if (sortedPanels[j].efficiency < sortedPanels[j - 1].efficiency) {
      
      let temp = sortedPanels[j];
      sortedPanels[j] = sortedPanels[j - 1];
      sortedPanels[j - 1] = temp;
      
      swapped = true;
    }
  }

  if (!swapped) break;
}


let topWorstPanels = sortedPanels.slice(0, worstPanelLimit);

// Menampilkan hasil ke terminal
console.log(`find 30 worst solar panel`);
console.log(topWorstPanels);
