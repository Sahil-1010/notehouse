
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const collectionsRoutes = require('./routes/collections');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/logs', logsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`NoteHouse server → http://localhost:${PORT}`));
}

start().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
