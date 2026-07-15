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
  // Removing newlines from the HTML string so it doesn't break the SSE format
  const sendUpdate = () => {
    const htmlContent = `
      <div class="profile-card" id="sse-wrapper-${id}">
          <h2>Grid informations: </h2>
          <p>Grid ID = ${id}</p>
          <p>Number of panels = </p>
          <p>Healthy panels = </p>
          <p>Minor degradated panels = </p>
          <p>Moderate degradated panels = </p>
          <p>Severe degradated panels = </p>
          <p>Worst panel = </p>
          <p>Best panel  = </p>
      </div>
    `;
    const cleanHtml = htmlContent.replace(/\n/g, '').trim();
    res.write(`data: ${cleanHtml}\n\n`);
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