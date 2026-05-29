const express = require('express');
const { Log } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const [logs, total] = await Promise.all([
      Log.find().sort({ created_at: -1 }).skip(offset).limit(limit).lean(),
      Log.countDocuments(),
    ]);

    res.json({
      logs:  logs.map(l => ({ ...l, id: l._id.toString(), _id: undefined })),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
