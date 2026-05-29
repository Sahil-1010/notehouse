# NoteHouse — Household Tracker

A premium dark-themed household tracker with sticky notes, counts, dates, and polls.

## Features

- **Count collections** — track increments/decrements with 10-second cooldown
- **Note collections** — colorful sticky note cards with inline editing
- **Date collections** — important dates with countdown badges
- **Poll collections** — multi-option polls with live vote results
- **User authentication** — register/login with unique username & password
- **Activity log** — every action is logged with timestamp and user
- **Pin collections** — pin favourites to the top
- **Search** — filter collections by name
- **Dark glassmorphism UI** — mobile-first, smooth animations

## Setup

### Requirements
- Node.js 18+
- npm

### Install dependencies

```bash
# From the project root
cd server && npm install
cd ../client && npm install
```

### Run (two terminal windows)

**Terminal 1 — Backend (port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd client
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Default Collections

On first run, two default collections are automatically created:
- **Water Delivered Count** (Count type)
- **Maid Leave Count** (Count type)

## Deleting Collections

Deleting any collection requires the admin password:
```
IamChutiya@69
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcrypt |
| Icons | Lucide React |
| Fonts | Syne (display), Outfit (body) |

## Folder Structure

```
notehouse/
├── server/
│   ├── db/database.js        # SQLite setup & seeding
│   ├── middleware/auth.js     # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Register / login
│   │   ├── collections.js    # All collection CRUD + actions
│   │   └── logs.js           # Activity log
│   └── index.js
└── client/
    └── src/
        ├── api/              # Axios API layer
        ├── context/          # Auth context
        ├── pages/            # Route pages
        └── components/
            ├── layout/       # Navbar, CollectionCard
            ├── ui/           # Modal
            └── collections/  # Count, Note, Date, Poll UIs
```
