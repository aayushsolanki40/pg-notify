# Quick Start Guide

## 1. Prerequisites Check

Make sure you have PostgreSQL installed and running:
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it (Ubuntu/Debian)
sudo service postgresql start

# Or on macOS with Homebrew
brew services start postgresql
```

## 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE pg_notify_demo;

# Exit psql
\q
```

## 3. Configure Environment

The `.env` file has been created with default values. Update if needed:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pg_notify_demo
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
```

## 4. Setup Database Tables and Triggers

```bash
npm run db:setup
```

This will create:
- `messages` table
- `chat_messages` table with automatic NOTIFY trigger
- `orders` table with automatic NOTIFY trigger
- Sample data

## 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 6. Test the Application

### Option 1: Use the Web Client

Open `client-example.html` in your browser:
```bash
# On Linux
xdg-open client-example.html

# On macOS
open client-example.html

# On Windows
start client-example.html
```

### Option 2: Use curl

In a new terminal, test the REST API:

```bash
# Publish a chat message
curl -X POST http://localhost:3000/api/notifications/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Alice",
    "message": "Hello World!",
    "room": "general"
  }'

# Publish an order update
curl -X POST http://localhost:3000/api/notifications/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-999",
    "status": "shipped",
    "customerId": "CUST-123"
  }'
```

### Option 3: Use WebSocket Client (wscat)

```bash
# Install wscat globally
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/ws

# Subscribe to chat channel
> {"type": "subscribe", "channel": "chat"}

# Publish a message
> {"type": "publish", "channel": "chat", "payload": {"user": "Bob", "message": "Hi!"}}

# List subscribed channels
> {"type": "list"}

# Unsubscribe
> {"type": "unsubscribe", "channel": "chat"}
```

## 7. Test Database Triggers

The database triggers automatically send notifications when data changes:

```bash
# Connect to PostgreSQL
psql -U postgres -d pg_notify_demo

# Insert a chat message (will trigger notification)
INSERT INTO chat_messages (user_name, message, room)
VALUES ('Database User', 'Message from database!', 'general');

# Update an order (will trigger notification)
UPDATE orders SET status = 'delivered' WHERE order_id = 'ORD-001';
```

If you have WebSocket clients subscribed to the `chat` or `orders` channels, they will receive these notifications in real-time!

## Common Issues

### PostgreSQL Connection Error
- Make sure PostgreSQL is running: `pg_isready`
- Check your credentials in `.env`
- Verify the database exists: `psql -l | grep pg_notify_demo`

### Port Already in Use
- Change the PORT in `.env` to a different value (e.g., 3001)

### Database Setup Fails
- Make sure you have created the database first
- Check that your PostgreSQL user has the necessary permissions

## Next Steps

1. **Explore the Code**: Check out the services in `src/services/`
2. **Add Custom Channels**: Create your own notification channels
3. **Build a Frontend**: Use the WebSocket API to build a real-time app
4. **Add Authentication**: Secure your endpoints
5. **Scale**: Add Redis for distributed pub/sub across multiple servers
