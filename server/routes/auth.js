const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, addLog } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.trim().length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ username: username.trim() });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    // Password uniqueness check across all users
    const allUsers = await User.find({}, 'password_hash');
    for (const u of allUsers) {
      if (await bcrypt.compare(password, u.password_hash)) {
        return res.status(400).json({ error: 'Password already in use — choose a different one' });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), password_hash: hash });

    addLog({ userId: user._id, username: user.username, action: 'registered account' });

    const SECRET = process.env.JWT_SECRET || 'notehouse_jwt_secret_2024_secure';
    const token = jwt.sign({ id: user._id.toString(), username: user.username }, SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id.toString(), username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    addLog({ userId: user._id, username, action: 'logged in' });

    const SECRET = process.env.JWT_SECRET || 'notehouse_jwt_secret_2024_secure';
    const token = jwt.sign({ id: user._id.toString(), username }, SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id.toString(), username } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
