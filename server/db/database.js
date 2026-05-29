const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Schemas ─────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  created_at:    { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  code:         { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  createdBy:    { type: String, default: 'system' },
  created_at:   { type: Date, default: Date.now },
});

const collectionSchema = new mongoose.Schema({
  roomId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  name:                { type: String, required: true },
  type:                { type: String, enum: ['count', 'note', 'date', 'poll'], required: true },
  pinned:              { type: Boolean, default: false },
  created_by:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  count_value:         { type: Number, default: 0 },
  count_last_updated:  { type: Date },
  created_at:          { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
  content:       { type: String, required: true },
  color:         { type: String, default: 'violet' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:    { type: Date, default: Date.now },
  updated_at:    { type: Date, default: Date.now },
});

const dateEventSchema = new mongoose.Schema({
  collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
  title:         { type: String, required: true },
  event_date:    { type: String, required: true },
  description:   { type: String, default: null },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:    { type: Date, default: Date.now },
});

const pollSchema = new mongoose.Schema({
  collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
  question:      { type: String, required: true },
  options: [{
    text:          { type: String, required: true },
    display_order: { type: Number, default: 0 },
  }],
  votes: [{
    user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    option_id: { type: mongoose.Schema.Types.ObjectId },
    voted_at:  { type: Date, default: Date.now },
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  roomId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username:        { type: String, required: true },
  action:          { type: String, required: true },
  collection_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
  collection_name: { type: String, default: null },
  created_at:      { type: Date, default: Date.now },
});

// ─── Models ──────────────────────────────────────────────────────────────────

const User       = mongoose.model('User',       userSchema);
const Room       = mongoose.model('Room',       roomSchema);
const Collection = mongoose.model('Collection', collectionSchema);
const Note       = mongoose.model('Note',       noteSchema);
const DateEvent  = mongoose.model('DateEvent',  dateEventSchema);
const Poll       = mongoose.model('Poll',       pollSchema);
const Log        = mongoose.model('Log',        logSchema);

// ─── Connect ─────────────────────────────────────────────────────────────────

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  await seedDefaults();
}

async function seedDefaults() {
  const ROOM_CODE     = '69069';
  const ROOM_PASSWORD = 'IamChutiya@69';

  let room = await Room.findOne({ code: ROOM_CODE });
  if (!room) {
    const passwordHash = await bcrypt.hash(ROOM_PASSWORD, 10);
    room = await Room.create({ name: "Sahil's Room", code: ROOM_CODE, passwordHash, createdBy: 'system' });
    console.log('Seeded: default room');
  }

  // Assign any legacy roomless collections to the default room
  await Collection.updateMany({ roomId: null }, { $set: { roomId: room._id } });

  const seeds = [
    { name: 'Water Delivered Count', type: 'count' },
    { name: 'Quick Notes',           type: 'note'  },
    { name: 'Important Dates',       type: 'date'  },
    { name: 'Dinner Tonight?',       type: 'poll'  },
  ];

  for (const col of seeds) {
    const exists = await Collection.findOne({ name: col.name, roomId: room._id });
    if (!exists) {
      const created = await Collection.create({ ...col, roomId: room._id, count_value: 0 });
      console.log(`Seeded: ${col.name}`);

      if (col.type === 'note') {
        await Note.insertMany([
          { collection_id: created._id, content: 'Buy milk',               color: 'amber'  },
          { collection_id: created._id, content: 'Electric bill pending',   color: 'rose'   },
          { collection_id: created._id, content: 'Call plumber',            color: 'cyan'   },
        ]);
      }

      if (col.type === 'date') {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 14);
        await DateEvent.insertMany([
          { collection_id: created._id, title: 'Rent Due',        event_date: nextMonth.toISOString().slice(0, 10) },
          { collection_id: created._id, title: 'Society Meeting', event_date: twoWeeks.toISOString().slice(0, 10)  },
        ]);
      }

      if (col.type === 'poll') {
        await Poll.create({
          collection_id: created._id,
          question: 'Dinner Tonight?',
          options: [
            { text: 'Pizza',   display_order: 0 },
            { text: 'Biryani', display_order: 1 },
            { text: 'Chinese', display_order: 2 },
          ],
          votes: [],
        });
      }
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function addLog({ roomId, userId, username, action, collectionId, collectionName }) {
  Log.create({
    roomId:          roomId         ?? null,
    user_id:         userId         ?? null,
    username:        username       ?? 'system',
    action,
    collection_id:   collectionId   ?? null,
    collection_name: collectionName ?? null,
  }).catch(err => console.error('Log write error:', err.message));
}

async function verifyRoomPassword(roomCode, password) {
  const room = await Room.findOne({ code: roomCode });
  if (!room) return { ok: false, error: 'Room not found' };
  const match = await bcrypt.compare(password, room.passwordHash);
  if (!match) return { ok: false, error: 'Incorrect room password' };
  return { ok: true, room };
}

module.exports = { connectDB, User, Room, Collection, Note, DateEvent, Poll, Log, addLog, verifyRoomPassword };
