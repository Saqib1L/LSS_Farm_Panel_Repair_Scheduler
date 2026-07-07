import { read } from 'fs';
import fs from 'fs/promises';
const filePath = "../data.json";
fs.writeFile(filePath, JSON.stringify([], null, 2));