import { read } from 'fs';
import fs from 'fs/promises';
const filePath = "../sources/data.json";

const deleteData = fs.writeFile(filePath, JSON.stringify([], null, 2));
if(deleteData) console.log("[DELETE]: Data has been deleted");