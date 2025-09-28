const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

// Ensure data directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Initialize database
const db = new Database(config.databasePath);
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE
  )
`);

// Helpful indexes
db.exec('CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_events_date ON events(scheduled_date)');

// Prepared statements
const statements = {
  getAllClubs: db.prepare('SELECT * FROM clubs ORDER BY created_at DESC'),
  getClubById: db.prepare('SELECT * FROM clubs WHERE id = ?'),
  getClubByName: db.prepare('SELECT * FROM clubs WHERE name = ?'),
  createClub: db.prepare('INSERT INTO clubs (name, description) VALUES (?, ?)'),
  searchClubs: db.prepare('SELECT * FROM clubs WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC'),

  getEventsByClubId: db.prepare('SELECT * FROM events WHERE club_id = ? ORDER BY scheduled_date ASC'),
  createEvent: db.prepare('INSERT INTO events (club_id, title, description, scheduled_date) VALUES (?, ?, ?, ?)'),
  getEventById: db.prepare('SELECT * FROM events WHERE id = ?')
};

module.exports = { db, statements };


