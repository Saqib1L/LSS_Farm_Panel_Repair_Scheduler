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

      // Validate & Update
      if(item.id !== undefined) {
        panels.set(item.id, item);
      };

      // Set debouncer
      if(updateTimer) clearTimeout(updateTimer)
      updateTimer = setTimeout(() => {
        sortPanels();
        updateTimer = null;
      }, 500);
    };
  });
  
});

server.listen(PORT, HOST, () => {
  console.log("[RANK_PANEL][RECEIVER]: Receiver is listening on port ", PORT);
});

const sortPanels = async () => {
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
  
  // Rewriting the result to the main_queue.json
  await saveTopWorstPanels(topWorstPanels);
};
