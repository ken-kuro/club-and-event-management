# Club & Event Management System

A RESTful API for managing game clubs and scheduling events. Built with Express.js and SQLite.

## Features

- Create and search game clubs with unique names and descriptions
- Schedule events for specific clubs with date/time validation
- Input validation and error handling
- SQLite database with proper relationships
- Docker support

## Getting Started

### Prerequisites

- Node.js 22.20.0+ (LTS)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:3000`.

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

The database will be persisted in the `./data/` directory.

## API Endpoints

### Clubs

- `GET /clubs` - Get all clubs (supports `?search=term` query parameter)
- `POST /clubs` - Create a new club

**Create Club Request:**
```json
{
  "name": "Chess Masters",
  "description": "Strategic chess games and tournaments"
}
```

### Events

- `GET /clubs/:id/events` - Get all events for a specific club
- `POST /clubs/:id/events` - Create an event for a club

**Create Event Request:**
```json
{
  "title": "Weekly Tournament",
  "description": "Join us for our weekly tournament",
  "scheduled_date": "2024-12-31T18:00:00.000Z"
}
```

### Utility

- `GET /health` - Health check endpoint

## Database Schema

### Clubs Table
```sql
CREATE TABLE clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE
);
```

## Validation Rules

- Club names: 1-100 characters, must be unique
- Club descriptions: 1-500 characters
- Event titles: 1-100 characters
- Event descriptions: 1-500 characters
- Event dates: Must be in the future, ISO 8601 format

## Development

```bash
# Start development server with auto-reload
npm run dev
```

Both local development and Docker use the same database location (`data/club_management.db`).

## Project Structure

```
├── server.js              # Main Express application
├── public/                 # Static files (basic frontend placeholder)
├── data/                   # Database directory
│   └── club_management.db # SQLite database (auto-created)
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose setup
```

## License

MIT