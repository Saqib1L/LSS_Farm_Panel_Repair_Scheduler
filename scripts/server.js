import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPage = "index.html";
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`[SERVER]: The server is running on port ${3000}`);
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/grids/:grid', (req, res) => {
  const grid = req.params.grid;
  console.log(`User is currently viewing grid: ${grid}`);
});

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

app.get('/clicked/:id', (req, res) => {
  const id = req.params.id;
  
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
      const gridInfo = (JSON.parse(gridData)).find(grid => grid.zone == id);
      
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
    console.log(`The content for id ${id} is updating for every 1 second`);
  }, 1000);

  req.on('close', () => {
    console.log(`Connection closed for grid id: ${id}`)
    clearInterval(updateEverySecond);
    res.end();
  });
});