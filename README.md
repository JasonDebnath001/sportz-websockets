# Sportz API

A real-time sports API built with Node.js that provides REST endpoints and WebSocket support for managing sports matches and live commentary.

## Features

- **Match Management**: Create, retrieve, and manage sports matches with real-time status tracking
- **Live Commentary**: Stream live commentary updates for ongoing matches
- **Real-time Updates**: WebSocket support for instant match and commentary notifications
- **Data Validation**: Request validation using Zod schemas
- **Security**: Arcjet middleware for DDoS protection and rate limiting
- **Performance Monitoring**: APM Insight integration for application performance tracking
- **Database Migrations**: Drizzle ORM with managed migrations
- **Production Ready**: Deployed on Vercel

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.x
- **Real-time Communication**: WebSocket (ws)
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Security**: Arcjet
- **Monitoring**: APM Insight
- **Deployment**: Vercel

## Project Structure

```
sportz/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── arcjet.js                # Security middleware with Arcjet
│   ├── db/
│   │   ├── db.js               # Database connection setup
│   │   └── schema.js           # Drizzle ORM schema definitions
│   ├── routes/
│   │   ├── matches.js          # Match endpoints
│   │   └── commentary.js       # Commentary endpoints
│   ├── utils/
│   │   └── match.status.js     # Match status utilities
│   ├── validation/
│   │   ├── matches.js          # Match request validation schemas
│   │   └── commentary.js       # Commentary request validation schemas
│   └── ws/
│       └── server.js           # WebSocket server setup
├── drizzle/                    # Database migrations
├── apminsightdata/             # APM monitoring data
├── package.json
├── drizzle.config.js           # Drizzle ORM configuration
├── vercel.json                 # Vercel deployment configuration
└── apminsightnode.json         # APM Insight configuration
```

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file** - Create a `.env.local` file in the root directory:
   ```env
   PORT=3000
   HOST=localhost
   DATABASE_URL=postgresql://user:password@localhost:5432/sportz
   ```

## Database Setup

1. **Create database migrations** (if needed):

   ```bash
   npm run db:generate
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

This will create the following tables:

- **matches** - Stores sports match information
- **commentary** - Stores live commentary for matches

### Database Schema

#### Matches Table

- `id` - Primary key (serial)
- `sport` - Sport type (text)
- `homeTeam` - Home team name (text)
- `awayTeam` - Away team name (text)
- `status` - Match status enum (scheduled, live, finished)
- `startTime` - Match start time (timestamp)
- `endTime` - Match end time (timestamp)
- `homeScore` - Home team score (integer, default: 0)
- `awayScore` - Away team score (integer, default: 0)
- `createdAt` - Creation timestamp (timestamp, auto)

#### Commentary Table

- `id` - Primary key (serial)
- `matchId` - Foreign key to matches table
- `minute` - Match minute (integer)
- `sequence` - Event sequence number (integer)
- `period` - Match period (text)
- `eventType` - Type of event (text)
- `actor` - Player or entity involved (text)
- `team` - Team involved (text)
- `message` - Commentary message (text)
- `metadata` - Additional JSON data (jsonb)
- `tags` - Array of tags (text array)
- `createdAt` - Creation timestamp (timestamp, auto)

## API Endpoints

### Matches

#### List Matches

```
GET /matches?limit=50
```

**Query Parameters:**

- `limit` - Maximum number of matches to return (default: 50)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "sport": "football",
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "status": "live",
      "homeScore": 2,
      "awayScore": 1,
      "startTime": "2026-04-03T14:00:00Z",
      "endTime": null,
      "createdAt": "2026-04-03T12:00:00Z"
    }
  ]
}
```

#### Create Match

```
POST /matches
Content-Type: application/json

{
  "sport": "football",
  "homeTeam": "Team A",
  "awayTeam": "Team B",
  "startTime": "2026-04-03T14:00:00Z",
  "endTime": "2026-04-03T16:00:00Z",
  "homeScore": 0,
  "awayScore": 0
}
```

**Response:** `201 Created`
Returns the created match object with auto-generated id and timestamps.

### Commentary

#### List Commentary for a Match

```
GET /matches/:id/commentary?limit=100
```

**Parameters:**

- `id` - Match ID
- `limit` - Maximum number of commentary entries to return (default: 100)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "matchId": 1,
      "minute": 45,
      "sequence": 1,
      "period": "1H",
      "eventType": "goal",
      "actor": "Player Name",
      "team": "Team A",
      "message": "Goal! Team A scores!",
      "metadata": { "confidence": 0.95 },
      "tags": ["goal", "important"],
      "createdAt": "2026-04-03T14:45:00Z"
    }
  ]
}
```

#### Create Commentary for a Match

```
POST /matches/:id/commentary
Content-Type: application/json

{
  "minute": 45,
  "sequence": 1,
  "period": "1H",
  "eventType": "goal",
  "actor": "Player Name",
  "team": "Team A",
  "message": "Goal! Team A scores!",
  "metadata": { "confidence": 0.95 },
  "tags": ["goal", "important"]
}
```

**Response:** `201 Created`
Returns the created commentary object with auto-generated id and timestamps.

## WebSocket Support

The WebSocket server runs on the same port as HTTP and is accessible at `/ws`.

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");
```

### Subscribe to Match Updates

Send a subscription message to receive real-time updates for a specific match:

```javascript
ws.send(
  JSON.stringify({
    type: "subscribe",
    matchId: 1,
  }),
);
```

### Events

Receive formatted updates:

- **Match Created**: Broadcast when a new match is created
- **Commentary Added**: Broadcast when new commentary is added to a subscribed match

### Limits

- Maximum 10,000 concurrent match subscriptions
- Maximum 100 subscriptions per WebSocket connection
- Match ID must be between 1 and 1,000,000

## Development

### Scripts

- **Start development server with auto-reload**:

  ```bash
  npm run dev
  ```

- **Start production server**:

  ```bash
  npm start
  ```

- **Generate database migrations**:

  ```bash
  npm run db:generate
  ```

- **Run database migrations**:
  ```bash
  npm run db:migrate
  ```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Server Configuration
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sportz

# Security
ARCJET_KEY=your_arcjet_key

# APM Monitoring
APMINSIGHT_KEY=your_apminsight_key
```

## Security

The API includes security middleware powered by Arcjet that provides:

- DDoS protection
- Rate limiting
- Request validation
- Threat detection

All requests are validated against Zod schemas to ensure data integrity.

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment with the following setup in `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### Steps to Deploy

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `ARCJET_KEY`
   - `APMINSIGHT_KEY`
   - `PORT`
   - `HOST`
4. Deploy

The WebSocket connection will automatically upgrade to `wss://` for secure connections on Vercel.

## Monitoring

The project includes APM Insight integration for real-time performance monitoring. Access your APM metrics through the APM Insight dashboard using your configured key.

## Error Handling

The API returns appropriate HTTP status codes and detailed error messages:

- `400` - Invalid request (validation errors included)
- `404` - Resource not found
- `500` - Server error

## Contributing

Contributions are welcome. Please ensure all requests are validated and follow the existing code patterns.

## License

ISC
