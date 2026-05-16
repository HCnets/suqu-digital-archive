import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'archives.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize mock data file if not exists
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    "poi-1": {
      "id": "poi-1",
      "title": "苏区红场",
      "description": "苏区红场旧址位于紫金县苏区镇炮子村，是全国唯一以“苏区”命名的乡镇。",
      "longitude": 115.345,
      "latitude": 23.362,
      "type": "revolution",
      "year": 1927
    },
    "poi-2": {
      "id": "poi-2",
      "title": "苏区镇人民政府",
      "description": "苏区镇现代行政与建设管理中枢。",
      "longitude": 115.338,
      "latitude": 23.358,
      "type": "government",
      "year": 2026
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Get all archives
app.get('/api/archives', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(Object.values(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Add new archive
app.post('/api/archives', (req, res) => {
  try {
    const newArchive = req.body;
    if (!newArchive.id) {
      newArchive.id = `poi-${Date.now()}`;
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data[newArchive.id] = newArchive;
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.status(201).json(newArchive);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(PORT, () => {
  console.log(`[SYS] Digital Archive Backend Server running on http://localhost:${PORT}`);
});