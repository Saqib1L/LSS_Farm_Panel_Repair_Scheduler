import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs/promises';
import { retrievePanel, fixPanel } from "./panelSimulation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPage = "index.html";
const app = express();
const PORT = 3000;

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
  let panel = await retrievePanel(panelId);
  if(panel) {
    res.json(panel);
    return;
  }
  res.status(200).json({error: "Panel not found"});
});

// API for replacing the efficiency of a panel to 100%
app.get('/api/fix-panel/:panel_id', async (req, res) => {
  let panelId = req.params.panel_id;
  let panel = await fixPanel(panelId);
  if(panel) {
    res.json(panel);
    return;
  }
  res.status(200).json({error: "Panel not found"});
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
    console.log(`Every content of grids are updated for every 1 second`);
  }, 1000);

  req.on('close', () => {
    console.log(`Connection closed for every grids`)
    clearInterval(updateEverySecond);
    res.end();
  });
});