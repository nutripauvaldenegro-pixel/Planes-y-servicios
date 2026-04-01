const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}
ensureDataDir();

// GET endpoint to read a JSON file
app.get('/api/data/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(DATA_DIR, `${filename}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return 404
      res.status(404).json({ error: 'File not found' });
    } else {
      console.error(`Error reading ${filename}.json:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST endpoint to write a JSON file
app.post('/api/data/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  const data = req.body;

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, message: `Successfully saved ${filename}.json` });
  } catch (err) {
    console.error(`Error writing ${filename}.json:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint to remove a JSON file (optional, but good for resets)
app.delete('/api/data/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(DATA_DIR, `${filename}.json`);

  try {
    await fs.unlink(filePath);
    res.json({ success: true, message: `Successfully deleted ${filename}.json` });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      console.error(`Error deleting ${filename}.json:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`JSON File Server running on http://localhost:${PORT}`);
});
