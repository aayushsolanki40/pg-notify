# PostgreSQL NOTIFY/LISTEN Pub/Sub Demo

A comprehensive Express TypeScript project demonstrating PostgreSQL's NOTIFY/LISTEN pub/sub mechanism with real-time WebSocket integration.

## Features

- ✅ **PostgreSQL NOTIFY/LISTEN** - Native pub/sub messaging
- ✅ **WebSocket Integration** - Real-time notifications to clients
- ✅ **REST API** - Publish messages via HTTP endpoints
- ✅ **Database Triggers** - Automatic notifications on database changes
- ✅ **Multiple Channels** - Chat, Orders, System notifications
- ✅ **TypeScript** - Full type safety
- ✅ **Clean Architecture** - Organized services and routes

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pg_notify_demo
   DB_USER=postgres
   DB_PASSWORD=postgres
   PORT=3000
   ```

3. **Create the database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE pg_notify_demo;
   \q
   ```

4. **Setup database tables and triggers:**
   ```bash
   npm run db:setup
   ```

## Usage

### Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with WebSocket available at `ws://localhost:3000/ws`.

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### REST API

#### 1. Publish Generic Notification
```bash
POST /api/notifications/publish
Content-Type: application/json

{
  "channel": "my_channel",
  "payload": {
    "message": "Hello World",
    "data": "any data"
  }
}
```

#### 2. Publish Chat Message
```bash
POST /api/notifications/chat
Content-Type: application/json

{
  "user": "Alice",
  "message": "Hello everyone!",
  "room": "general"
}
```

#### 3. Publish Order Update
```bash
POST /api/notifications/order
Content-Type: application/json

{
  "orderId": "ORD-123",
  "status": "shipped",
  "customerId": "CUST-456",
  "details": {
    "trackingNumber": "TRACK-789"
  }
}
```

#### 4. Publish System Notification
```bash
POST /api/notifications/system
Content-Type: application/json

{
  "type": "maintenance",
  "message": "System will be down for maintenance",
  "severity": "warning",
  "metadata": {
    "scheduledTime": "2024-01-01T00:00:00Z"
  }
}
```

#### 5. Get Active Channels
```bash
GET /api/notifications/channels
```

### WebSocket API

Connect to `ws://localhost:3000/ws` and send JSON messages:

#### Subscribe to Channel
```json
{
  "type": "subscribe",
  "channel": "chat"
}
```

#### Unsubscribe from Channel
```json
{
  "type": "unsubscribe",
  "channel": "chat"
}
```

#### Publish Message
```json
{
  "type": "publish",
  "channel": "chat",
  "payload": {
    "user": "Alice",
    "message": "Hello!"
  }
}
```

#### List Subscribed Channels
```json
{
  "type": "list"
}
```

## Testing with curl

### Publish a chat message:
```bash
curl -X POST http://localhost:3000/api/notifications/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Alice",
    "message": "Hello from curl!",
    "room": "general"
  }'
```

### Publish an order update:
```bash
curl -X POST http://localhost:3000/api/notifications/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-999",
    "status": "delivered",
    "customerId": "CUST-123"
  }'
```

## Testing with WebSocket Client

You can use a WebSocket client like `wscat`:

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket server
wscat -c ws://localhost:3000/ws

# Subscribe to chat channel
> {"type": "subscribe", "channel": "chat"}

# You'll receive notifications when messages are published
```

## Database Triggers

The project includes PostgreSQL triggers that automatically send notifications when data changes:

### Chat Messages Trigger
When you insert a chat message directly into the database:
```sql
INSERT INTO chat_messages (user_name, message, room)
VALUES ('Bob', 'Hello from database!', 'general');
```
A notification is automatically sent to the `chat` channel.

### Order Updates Trigger
When you insert or update an order:
```sql
UPDATE orders 
SET status = 'shipped' 
WHERE order_id = 'ORD-001';
```
A notification is automatically sent to the `orders` channel.

## Project Structure

```
pg-notify/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection pool
│   ├── services/
│   │   ├── NotificationService.ts   # NOTIFY/LISTEN implementation
│   │   └── WebSocketService.ts      # WebSocket server
│   ├── routes/
│   │   └── notifications.ts     # REST API routes
│   ├── scripts/
│   │   └── setup-db.ts          # Database setup script
│   └── index.ts                 # Application entry point
├── .env.example                 # Environment variables template
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## How It Works

### PostgreSQL NOTIFY/LISTEN

1. **LISTEN**: A PostgreSQL client subscribes to a channel using `LISTEN channel_name`
2. **NOTIFY**: Any client can send a notification using `NOTIFY channel_name, 'payload'`
3. **Receive**: All subscribed clients receive the notification in real-time

### Architecture Flow

1. **Client subscribes** via WebSocket → `{"type": "subscribe", "channel": "chat"}`
2. **NotificationService** creates a dedicated PostgreSQL connection and executes `LISTEN chat`
3. **Message published** via REST API or database trigger
4. **PostgreSQL sends notification** to all listening connections
5. **NotificationService** receives notification and triggers callbacks
6. **WebSocketService** pushes notification to subscribed WebSocket clients
7. **Client receives** real-time notification

## Use Cases

- 💬 **Real-time Chat** - Instant message delivery
- 📦 **Order Tracking** - Live order status updates
- 🔔 **System Notifications** - Broadcast system events
- 📊 **Dashboard Updates** - Real-time data synchronization
- 🎮 **Gaming** - Player state updates
- 📈 **Stock Tickers** - Live price updates
- 🚨 **Alerts** - Critical system alerts

## Advanced Features

### Multiple Subscribers
Multiple clients can subscribe to the same channel and all will receive notifications.

### Channel Isolation
Each channel is independent - subscribing to `chat` won't receive `orders` notifications.

### JSON Payloads
Payloads are automatically serialized/deserialized as JSON for easy data transfer.

### Automatic Cleanup
When clients disconnect, their subscriptions are automatically cleaned up.

## Performance Considerations

- Each channel subscription creates a dedicated PostgreSQL connection
- Connection pooling is used for publishing messages
- WebSocket connections are lightweight and scalable
- PostgreSQL NOTIFY is very efficient for pub/sub patterns

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### WebSocket Connection Issues
- Check firewall settings
- Verify port 3000 is available
- Check browser console for errors

### No Notifications Received
- Verify subscription: Send `{"type": "list"}` via WebSocket
- Check server logs for errors
- Ensure channel names match exactly

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
