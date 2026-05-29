require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const collectionsRoutes = require('./routes/collections');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5169;
const isProd = process.env.NODE_ENV === 'production';

// In production the frontend is served from the same origin — CORS only needed for local dev
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: isProd ? '*' : allowedOrigins, credentials: !isProd }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/logs', logsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Unknown /api/* paths → JSON 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve built frontend in production
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`));
}

start().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
