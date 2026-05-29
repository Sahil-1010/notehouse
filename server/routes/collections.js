const express = require('express');
const { Collection, Note, DateEvent, Poll, addLog } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const DELETE_PASSWORD = 'IamChutiya@69';

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmtCol(col) {
  return {
    id:         col._id.toString(),
    name:       col.name,
    type:       col.type,
    pinned:     col.pinned ? 1 : 0,
    created_at: col.created_at,
  };
}

function fmtNote(n) {
  return { ...n, id: n._id.toString(), collection_id: n.collection_id.toString(), _id: undefined };
}

function fmtDate(d) {
  return { ...d, id: d._id.toString(), collection_id: d.collection_id.toString(), _id: undefined };
}

function fmtPoll(poll, userId) {
  const userVoteEntry = poll.votes.find(v => v.user_id?.toString() === userId);
  return {
    id:            poll._id.toString(),
    collection_id: poll.collection_id.toString(),
    question:      poll.question,
    created_by:    poll.created_by?.toString(),
    created_at:    poll.created_at,
    options: poll.options.map(o => ({
      id:            o._id.toString(),
      text:          o.text,
      display_order: o.display_order,
      votes:         poll.votes.filter(v => v.option_id?.toString() === o._id.toString()).length,
    })),
    userVote: userVoteEntry ? userVoteEntry.option_id?.toString() : null,
  };
}

// ─── Collections ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const cols = await Collection.find().sort({ pinned: -1, created_at: 1 }).lean();
    const today = new Date().toISOString().slice(0, 10);

    const results = await Promise.all(cols.map(async col => {
      let preview = null;
      const id = col._id;

      if (col.type === 'count') {
        preview = { value: col.count_value || 0 };
      } else if (col.type === 'note') {
        preview = { count: await Note.countDocuments({ collection_id: id }) };
      } else if (col.type === 'date') {
        const next = await DateEvent.findOne({ collection_id: id, event_date: { $gte: today } }).sort({ event_date: 1 }).lean();
        preview = { nextEvent: next ? { title: next.title, event_date: next.event_date } : null };
      } else if (col.type === 'poll') {
        preview = { pollCount: await Poll.countDocuments({ collection_id: id }) };
      }

      return { ...fmtCol(col), preview };
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name?.trim() || !type) return res.status(400).json({ error: 'Name and type required' });
    if (!['count', 'note', 'date', 'poll'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const col = await Collection.create({ name: name.trim(), type, created_by: req.user.id, count_value: 0 });
    addLog({ userId: req.user.id, username: req.user.username, action: `created collection "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json({ ...fmtCol(col), preview: getDefaultPreview(type) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });

    let data = null;

    if (col.type === 'count') {
      data = { value: col.count_value || 0, last_updated: col.count_last_updated };
    } else if (col.type === 'note') {
      const notes = await Note.find({ collection_id: col._id }).sort({ updated_at: -1 }).lean();
      data = { notes: notes.map(fmtNote) };
    } else if (col.type === 'date') {
      const dates = await DateEvent.find({ collection_id: col._id }).sort({ event_date: 1 }).lean();
      data = { dates: dates.map(fmtDate) };
    } else if (col.type === 'poll') {
      const polls = await Poll.find({ collection_id: col._id }).sort({ created_at: -1 });
      data = { polls: polls.map(p => fmtPoll(p, req.user.id)) };
    }

    res.json({ ...fmtCol(col), data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, pinned } = req.body;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });

    if (name !== undefined) {
      col.name = name.trim();
      addLog({ userId: req.user.id, username: req.user.username, action: `renamed collection to "${name.trim()}"`, collectionId: col._id, collectionName: name.trim() });
    }
    if (pinned !== undefined) {
      col.pinned = !!pinned;
      addLog({ userId: req.user.id, username: req.user.username, action: `${pinned ? 'pinned' : 'unpinned'} "${col.name}"`, collectionId: col._id, collectionName: col.name });
    }
    await col.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    if (password !== DELETE_PASSWORD) return res.status(403).json({ error: 'Incorrect password' });

    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });

    await Note.deleteMany({ collection_id: col._id });
    await DateEvent.deleteMany({ collection_id: col._id });
    await Poll.deleteMany({ collection_id: col._id });
    await col.deleteOne();

    addLog({ userId: req.user.id, username: req.user.username, action: `deleted collection "${col.name}"`, collectionId: col._id, collectionName: col.name });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Count ───────────────────────────────────────────────────────────────────

router.post('/:id/count', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['increment', 'decrement'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const col = await Collection.findOne({ _id: req.params.id, type: 'count' });
    if (!col) return res.status(404).json({ error: 'Count collection not found' });

    col.count_value = (col.count_value || 0) + (action === 'increment' ? 1 : -1);
    col.count_last_updated = new Date();
    await col.save();

    addLog({ userId: req.user.id, username: req.user.username, action: `${action === 'increment' ? 'incremented' : 'decremented'} "${col.name}" → ${col.count_value}`, collectionId: col._id, collectionName: col.name });
    res.json({ value: col.count_value });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Notes ───────────────────────────────────────────────────────────────────

router.post('/:id/notes', async (req, res) => {
  try {
    const { content, color } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    const col = await Collection.findOne({ _id: req.params.id, type: 'note' });
    if (!col) return res.status(404).json({ error: 'Note collection not found' });

    const note = await Note.create({ collection_id: col._id, content: content.trim(), color: color || 'violet', created_by: req.user.id });
    addLog({ userId: req.user.id, username: req.user.username, action: `added note to "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json(fmtNote(note.toObject()));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/notes/:noteId', async (req, res) => {
  try {
    const { content, color } = req.body;
    const note = await Note.findOne({ _id: req.params.noteId, collection_id: req.params.id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (content !== undefined) note.content = content.trim();
    if (color !== undefined) note.color = color;
    note.updated_at = new Date();
    await note.save();

    const col = await Collection.findById(req.params.id, 'name');
    addLog({ userId: req.user.id, username: req.user.username, action: `edited note in "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json(fmtNote(note.toObject()));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, collection_id: req.params.id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    await note.deleteOne();
    const col = await Collection.findById(req.params.id, 'name');
    addLog({ userId: req.user.id, username: req.user.username, action: `deleted note from "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Dates ───────────────────────────────────────────────────────────────────

router.post('/:id/dates', async (req, res) => {
  try {
    const { title, event_date, description } = req.body;
    if (!title?.trim() || !event_date) return res.status(400).json({ error: 'Title and date required' });

    const col = await Collection.findOne({ _id: req.params.id, type: 'date' });
    if (!col) return res.status(404).json({ error: 'Date collection not found' });

    const dateEvent = await DateEvent.create({ collection_id: col._id, title: title.trim(), event_date, description: description || null, created_by: req.user.id });
    addLog({ userId: req.user.id, username: req.user.username, action: `added date "${title.trim()}" to "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json(fmtDate(dateEvent.toObject()));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/dates/:dateId', async (req, res) => {
  try {
    const dateEvent = await DateEvent.findOne({ _id: req.params.dateId, collection_id: req.params.id });
    if (!dateEvent) return res.status(404).json({ error: 'Date not found' });

    await dateEvent.deleteOne();
    const col = await Collection.findById(req.params.id, 'name');
    addLog({ userId: req.user.id, username: req.user.username, action: `deleted date "${dateEvent.title}" from "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Polls ───────────────────────────────────────────────────────────────────

router.post('/:id/polls', async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options required' });
    }

    const col = await Collection.findOne({ _id: req.params.id, type: 'poll' });
    if (!col) return res.status(404).json({ error: 'Poll collection not found' });

    const poll = await Poll.create({
      collection_id: col._id,
      question: question.trim(),
      options: options.map((text, i) => ({ text: text.trim(), display_order: i })),
      votes: [],
      created_by: req.user.id,
    });
    addLog({ userId: req.user.id, username: req.user.username, action: `created poll in "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json(fmtPoll(poll, req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/polls/:pollId/vote', async (req, res) => {
  try {
    const { optionId } = req.body;
    if (!optionId) return res.status(400).json({ error: 'Option ID required' });

    const poll = await Poll.findOne({ _id: req.params.pollId, collection_id: req.params.id });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const option = poll.options.id(optionId);
    if (!option) return res.status(400).json({ error: 'Invalid option' });

    poll.votes = poll.votes.filter(v => v.user_id?.toString() !== req.user.id);
    poll.votes.push({ user_id: req.user.id, option_id: option._id, voted_at: new Date() });
    await poll.save();

    const col = await Collection.findById(req.params.id, 'name');
    addLog({ userId: req.user.id, username: req.user.username, action: `voted in poll "${poll.question}"`, collectionId: col._id, collectionName: col.name });

    res.json(fmtPoll(poll, req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/polls/:pollId', async (req, res) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.pollId, collection_id: req.params.id });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    await poll.deleteOne();
    const col = await Collection.findById(req.params.id, 'name');
    addLog({ userId: req.user.id, username: req.user.username, action: `deleted poll from "${col.name}"`, collectionId: col._id, collectionName: col.name });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

function getDefaultPreview(type) {
  if (type === 'count') return { value: 0 };
  if (type === 'note')  return { count: 0 };
  if (type === 'date')  return { nextEvent: null };
  if (type === 'poll')  return { pollCount: 0 };
  return {};
}
