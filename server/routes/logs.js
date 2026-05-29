const express = require('express');
const { Log, verifyRoomPassword } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.delete('/clean', async (req, res) => {
  try {
    const { roomCode, password } = req.body;
    const { ok, error, room } = await verifyRoomPassword(roomCode, password);
    if (!ok) return res.status(403).json({ error });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 10);

    const result = await Log.deleteMany({ roomId: room._id, created_at: { $lt: cutoff } });
    res.json({ deleted: result.deletedCount });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { roomId, limit: rawLimit, offset: rawOffset } = req.query;
    if (!roomId) return res.status(400).json({ error: 'roomId required' });

    const limit  = Math.min(parseInt(rawLimit)  || 100, 500);
    const offset = parseInt(rawOffset) || 0;

    const filter = { roomId };
    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ created_at: -1 }).skip(offset).limit(limit).lean(),
      Log.countDocuments(filter),
    ]);

    res.json({
      logs:  logs.map(l => ({ ...l, id: l._id.toString(), _id: undefined })),
      total,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
