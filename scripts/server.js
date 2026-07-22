import express from "express";
import net from 'net';
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPage = "index.html";
const app = express();
const PORT = 3000;
const PORT_FOR_SIMULATION = 9002;
const HOST = '127.0.0.1';

function sendFixCommand(panelId) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = '';
    client.connect(PORT_FOR_SIMULATION, HOST, () => {
      client.write(JSON.stringify({ action: 'fix', id: panelId }) + '\n');
    });
    client.on('data', (chunk) => {
      buffer += chunk.toString();
      if (buffer.includes('\n')) {
        client.end();
        try { resolve(JSON.parse(buffer.trim())); } catch (err) { reject(err); }
      }
    });
    client.on('error', reject);
  });
}

function sendLookupCommand(panelId) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = '';
    client.connect(PORT_FOR_SIMULATION, HOST, () => {
      client.write(JSON.stringify({ action: 'lookup', id: panelId }) + '\n');
    });
    client.on('data', (chunk) => {
      buffer += chunk.toString();
      if (buffer.includes('\n')) {
        client.end();
        try { resolve(JSON.parse(buffer.trim())); } catch (err) { reject(err); }
      }
    });
    client.on('error', reject);
  });
}

app.listen(PORT, () => {
  console.log(`[SERVER]: The server is running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, '..', 'public')));
// ADD THIS: Tell Express to serve the outside 'scripts' folder at the '/scripts' URL
app.use('/scripts', express.static(path.join(__dirname, '..', 'scripts')));

// Retrieving top 30 worst panels from main_queue.json
app.get('/maintenance-queue', async (req, res) => {
  try {
    const rawData = await fs.readFile(path.join(__dirname, '..', 'sources', 'main_queue.json'), 'utf8');
    const topPanels = JSON.parse(rawData);
    res.json(topPanels);
  } catch (error) {
    console.log('[SERVER]: Could not read maintenance queue:', error.message);
    res.json([]);
  }
});

// API for retrieving panel information using form repairment
app.get('/api/repair-panel/:panel_id', async (req, res) => {
  let panelId = req.params.panel_id;
  try {
    const result = await sendLookupCommand(panelId);
    result.ok ? res.json(result.panel) : res.json({ error: result.error });
  } catch {
    res.status(500).json({ error: "Could not reach simulation service" });
  }
});

// API for replacing the efficiency of a panel to 100%
app.get('/api/fix-panel/:panel_id', async (req, res) => {
  let panelId = req.params.panel_id;
  try {
    const result = await sendFixCommand(panelId);
    result.ok ? res.json(result.panel) : res.json({ error: result.error });
  } catch {
    res.status(500).json({ error: "Could not reach simulation service" });
  }
});

// Retrieving grids statistic from statistics.json
app.get('/retrieve-grids', (req, res) => {
    // HTTP headers for SSE connection
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    'connection': 'keep-alive'
  });
    // SSE requires data to be prefixed with "data: " and end with two newlines
  const sendUpdate = async () => {    
    try {
      const gridData = await fs.readFile(path.join(__dirname, '..', 'sources', 'statistics.json'), 'utf8');
      if(!gridData || !gridData.trim()) return;
      const gridInfo = JSON.parse(gridData);
      // Safety check: Only send if the zone actually exists
      if (gridInfo) {
        res.write(`data: ${JSON.stringify(gridInfo)}\n\n`);
      } else {
        // Send a controlled error object instead of 'undefined'
        res.write(`data: ${JSON.stringify({ error: "Zone not found" })}\n\n`);
      }
    } catch (error) {
      console.error("Error reading statistics.json:", error);
    }
  }

  const updateEverySecond = setInterval(() => {
    sendUpdate();
    console.log(`[SERVER]: Every content of grids are updated for every 1 second`);
  }, 1000);

  req.on('close', () => {
    console.log(`Connection closed for every grids`)
    clearInterval(updateEverySecond);
    res.end();
  });
});

