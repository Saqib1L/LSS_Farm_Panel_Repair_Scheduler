import net from 'net';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname =  path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'sources', 'main_queue.json');

async function saveTopWorstPanels(topWorstPanels) {
  await fs.writeFile(outputPath, JSON.stringify(topWorstPanels, null, 2));
}

// Retrieve data from data.json
// const readData = async () => {
//   // File validation checking
//   try {
//     const rawData = await fs.readFile(filePath, 'utf8');
//     if(!rawData.trim()) {
//       return [];
//     }
//     return JSON.parse(rawData);
//   } catch (error) {
//     if(error.code === "ENOENT") {
//       console.log("[SERVER]: The data.json does not exists, the program is creating one...");
//       await fs.writeFile(filePath, JSON.stringify([], null, 2));
//       return [];
//     }
//   }
// };

// Variables declaration
const worstPanelLimit = 30; 
const PORT = 9001;
const HOST = '127.0.0.1';

// Receiving data from the other file
let panels = new Map();
let updateTimer = null;

// Inter Process Communication (IPC)
const server = net.createServer((socket) => {
  const rl = readline.createInterface({input: socket});
  
  rl.on('line', (line) => {
    const batch = JSON.parse(line); // Received 5000 items
    for (const item of batch) {
      // if(!updateTimer) updateTimer = setTimeout(sortPanels(), 1000);
      // Validate & Update
      if(item.id !== undefined) {
        panels.set(item.id, item);
      };
      if(!updateTimer) {
        updateTimer = setTimeout(() => {
          sortPanels();
          updateTimer = null;
        }, 1000);
      }
    };
  });
  
});

server.listen(PORT, HOST, () => {
  console.log("[RANK_PANEL][RECEIVER]: Receiver is listening on port ", PORT);
});

const sortPanels = async () => {
  // let panels = await readData();
  let sortedPanels = [...panels.values()].map(item => item.val);
  let totalPanels = sortedPanels.length;
  
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
  
  // Displaying result to the terminal
  await saveTopWorstPanels(topWorstPanels);
};
