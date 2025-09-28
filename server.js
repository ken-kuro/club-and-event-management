// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Database = require('better-sqlite3');
const { body, param, query, validationResult } = require('express-validator');

const app = express();

// Environment configuration
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || 'data/club_management.db',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

// Initialize SQLite database
const fs = require('fs');
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(config.databasePath);

// Create tables if they don't exist
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

console.log(`Database initialized successfully (${config.databasePath})`);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Create user-friendly error message
    const firstError = errors.array()[0];
    const errorMessage = firstError.msg || 'Validation error';
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      errors: errors.array()
    });
  }
  next();
};

// Database prepared statements
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

// Routes

// GET /clubs - Get all clubs or search clubs
app.get('/clubs', [
  query('search').optional().isLength({ min: 1 }).trim()
], handleValidationErrors, (req, res) => {
  try {
    let clubs;
    
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      clubs = statements.searchClubs.all(searchTerm, searchTerm);
    } else {
      clubs = statements.getAllClubs.all();
    }
    
    res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Error fetching clubs:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /clubs - Create a new club
app.post('/clubs', [
  body('name')
    .notEmpty()
    .withMessage('Club name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Club name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Club description must be 500 characters or less')
    .trim()
], handleValidationErrors, (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if club name already exists
    const existingClub = statements.getClubByName.get(name);
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'A club with this name already exists'
      });
    }
    
    const result = statements.createClub.run(name, description);
    const newClub = statements.getClubById.get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: newClub
    });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Error creating club:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /clubs/:id/events - Create an event for a specific club
app.post('/clubs/:id/events', [
  param('id').isInt({ min: 1 }).withMessage('Invalid club ID'),
  body('title')
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Event title must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Event description must be 500 characters or less')
    .trim(),
  body('scheduled_date')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Event date must be in the future');
      }
      return true;
    })
], handleValidationErrors, (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const { title, description, scheduled_date } = req.body;
    
    // Check if club exists
    const club = statements.getClubById.get(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    const result = statements.createEvent.run(clubId, title, description, scheduled_date);
    const newEvent = statements.getEventById.get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Error creating event:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /clubs/:id/events - Get all events for a specific club
app.get('/clubs/:id/events', [
  param('id').isInt({ min: 1 }).withMessage('Invalid club ID')
], handleValidationErrors, (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    
    // Check if club exists
    const club = statements.getClubById.get(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    const events = statements.getEventsByClubId.all(clubId);
    
    res.json({
      success: true,
      data: {
        club: club,
        events: events
      }
    });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Error fetching events:', error);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  db.close();
  process.exit(0);
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Database: ${config.databasePath}`);
  console.log(`Rate limiting: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 1000 / 60} minutes`);
});

module.exports = app;
