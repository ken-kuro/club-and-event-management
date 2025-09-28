# Club & Event Management System

A RESTful API for managing game clubs and scheduling events. Built with Express.js, SQLite, and Tailwind CSS.

## Features

- Create and search game clubs with unique names
- Schedule events for clubs with date/time validation  
- Clean, responsive web interface
- Input validation and error handling
- SQLite database with proper relationships
- Docker support for easy deployment

## Quick Start

### Option 1: Using Docker (Recommended)

**Prerequisites:** Docker and Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd club-and-event-management

# Start the application
docker compose up --build

# Or run in background
docker compose up --build -d
```

The application will be available at `http://localhost:3000`

To stop:
```bash
docker compose down
```

### Option 2: Using Node.js Directly

**Prerequisites:** Node.js 22.20.0+ (LTS)

```bash
# Clone the repository
git clone <repository-url>
cd club-and-event-management

# Install dependencies
npm install

# Start the application
npm start

# For development with auto-reload
npm run dev
```

The application will be available at `http://localhost:3000`

**Important:** Choose either Docker OR Node.js for development. If you run Docker first, it creates database files that may require root access to modify. To switch from Docker to local development:

```bash
# Stop Docker and remove the database
docker compose down
sudo rm -rf data/
# Then run with Node.js
npm start
```

## Usage

1. **Web Interface**: Open `http://localhost:3000` in your browser
2. **Create Clubs**: Click "New Club" to create clubs
3. **Schedule Events**: Click "Schedule Event" on any club card
4. **Search**: Use the search bar to find clubs by name or description
5. **View Events**: Click "Show Events" to see scheduled events for a club

## API Endpoints

## Testing

The tests are simple HTTP checks against a running server.

1) Start the server in one terminal
```bash
npm start
```

2) In another terminal, run the tests
```bash
npm test
```

Notes:
- Tests assume the server is available at http://localhost:3000
- No separate test database is created; the tests are read/write and idempotent thanks to unique names

### Clubs
- `GET /clubs` - Get all clubs (supports `?search=term`)
- `POST /clubs` - Create a new club

**Example: Create Club**
```bash
curl -X POST http://localhost:3000/clubs \
  -H "Content-Type: application/json" \
  -d '{"name":"Chess Club","description":"Strategic games"}'
```

### Events  
- `GET /clubs/:id/events` - Get events for a club
- `POST /clubs/:id/events` - Create an event

**Example: Create Event**
```bash
curl -X POST http://localhost:3000/clubs/1/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Tournament","scheduled_date":"2030-12-31T18:00:00.000Z"}'
```

### Health Check
- `GET /health` - Server health status

## Data Storage

- **Local Development**: Database stored in `data/club_management.db`
- **Docker**: Database persisted in `./data/` directory (automatically created)
- **Database Schema**: SQLite with clubs and events tables (foreign keys enabled, indexes on `events.club_id` and `events.scheduled_date`)

## Field Requirements

**Required Fields (marked with *):**
- Club Name*
- Event Title*  
- Event Date & Time*

**Optional Fields:**
- Club Description (helpful placeholder provided)
- Event Description (helpful placeholder provided)

## Development

### Project Structure
```
├── server.js              # App entry; wires routes and middleware
├── src/
│   ├── config.js          # Env + app config
│   ├── db.js              # DB init, schema, indexes, prepared statements
│   ├── validators.js      # Validation chains + error handler
│   └── routes/
│       ├── clubs.js       # /clubs (GET, POST)
│       └── events.js      # /clubs/:id/events (GET, POST)
├── public/                # Frontend files
│   ├── index.html         # Web interface
│   └── app.js             # Frontend JavaScript
├── data/                  # SQLite database directory (persisted)
├── test/
│   └── api.test.js        # Basic API tests
├── package.json           # Scripts and deps
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose setup
```

### Database Schema

**Clubs Table:**
```sql
CREATE TABLE clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Events Table:**
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE
);
```

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

**Docker permission issues:**
```bash
# Stop containers and rebuild
docker compose down
docker compose up --build
```

**Database issues:**
```bash
# Remove database to start fresh (local dev)
rm -f data/club_management.db
# Then restart the application
```

### System Requirements

- **Node.js**: Version 22.20.0 or higher (LTS recommended)
- **Docker**: Version 20.0+ with Docker Compose
- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **Memory**: Minimum 512MB available RAM
- **Storage**: ~50MB for application and dependencies

## License

MIT