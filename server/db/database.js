const mongoose = require('mongoose');

// ─── Schemas ─────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  created_at:    { type: Date, default: Date.now },
});

const collectionSchema = new mongoose.Schema({
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
  event_date:    { type: String, required: true }, // stored as 'YYYY-MM-DD'
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
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username:        { type: String, required: true },
  action:          { type: String, required: true },
  collection_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
  collection_name: { type: String, default: null },
  created_at:      { type: Date, default: Date.now },
});

// ─── Models ──────────────────────────────────────────────────────────────────

const User       = mongoose.model('User',       userSchema);
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
  const defaults = [
    { name: 'Water Delivered Count', type: 'count' },
    { name: 'Maid Leave Count',      type: 'count' },
  ];
  for (const col of defaults) {
    const exists = await Collection.findOne({ name: col.name });
    if (!exists) {
      await Collection.create({ ...col, count_value: 0 });
      console.log(`Seeded: ${col.name}`);
    }
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function addLog({ userId, username, action, collectionId, collectionName }) {
  Log.create({
    user_id:         userId    ?? null,
    username:        username  ?? 'system',
    action,
    collection_id:   collectionId   ?? null,
    collection_name: collectionName ?? null,
  }).catch(err => console.error('Log write error:', err.message));
}

module.exports = { connectDB, User, Collection, Note, DateEvent, Poll, Log, addLog };
