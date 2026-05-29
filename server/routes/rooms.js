const express = require('express');
const bcrypt = require('bcryptjs');
const { Room } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, code, password } = req.body;
    if (!name?.trim() || !code?.trim() || !password) {
      return res.status(400).json({ error: 'Name, code, and password are required' });
    }
    if (!/^\w+$/.test(code.trim())) {
      return res.status(400).json({ error: 'Room code can only contain letters, numbers, and underscores' });
    }

    const existing = await Room.findOne({ code: code.trim() });
    if (existing) return res.status(409).json({ error: 'Room code already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const room = await Room.create({
      name: name.trim(),
      code: code.trim(),
      passwordHash,
      createdBy: req.user.username,
    });

    res.json({ id: room._id.toString(), name: room.name, code: room.code });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room by code (no password needed to view)
router.get('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ id: room._id.toString(), name: room.name, code: room.code });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
