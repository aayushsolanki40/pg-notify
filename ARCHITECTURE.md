# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Browser    │    │  Mobile App  │    │   CLI Tool   │      │
│  │  (WebSocket) │    │  (WebSocket) │    │    (REST)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │                │
└─────────┼───────────────────┼───────────────────┼────────────────┘
          │                   │                   │
          │ WebSocket         │ WebSocket         │ HTTP
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼────────────────┐
│                      Application Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Express.js Server (index.ts)                   │ │
│  │                                                              │ │
│  │  ┌──────────────────┐         ┌──────────────────┐         │ │
│  │  │ WebSocketService │         │  REST API Routes │         │ │
│  │  │   (ws://...)     │         │  (/api/...)      │         │ │
│  │  └────────┬─────────┘         └────────┬─────────┘         │ │
│  │           │                            │                    │ │
│  │           └────────────┬───────────────┘                    │ │
│  │                        │                                     │ │
│  │              ┌─────────▼──────────┐                         │ │
│  │              │ NotificationService │                         │ │
│  │              │  (LISTEN/NOTIFY)    │                         │ │
│  │              └─────────┬──────────┘                         │ │
│  └────────────────────────┼────────────────────────────────────┘ │
│                           │                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            │ pg (node-postgres)
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                      Database Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL                               │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Tables     │  │   Triggers   │  │   Channels   │     │ │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤     │ │
│  │  │ messages     │  │ chat_trigger │  │ chat         │     │ │
│  │  │ chat_msgs    │  │ order_trigger│  │ orders       │     │ │
│  │  │ orders       │  │              │  │ system       │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Publishing a Message (REST API)

```
Client → POST /api/notifications/chat
   ↓
Express Route Handler (notifications.ts)
   ↓
NotificationService.publish()
   ↓
PostgreSQL: NOTIFY chat, 'payload'
   ↓
All LISTEN connections receive notification
   ↓
NotificationService callbacks triggered
   ↓
WebSocketService sends to subscribed clients
   ↓
Client receives real-time notification
```

### 2. Database Trigger Flow

```
Application → INSERT INTO chat_messages
   ↓
PostgreSQL Trigger: notify_chat_message()
   ↓
NOTIFY chat, 'payload'
   ↓
All LISTEN connections receive notification
   ↓
NotificationService callbacks triggered
   ↓
WebSocketService sends to subscribed clients
   ↓
Client receives real-time notification
```

### 3. WebSocket Subscription Flow

```
Client → WebSocket Connect
   ↓
WebSocketService.initialize()
   ↓
Client → {"type": "subscribe", "channel": "chat"}
   ↓
NotificationService.subscribe()
   ↓
PostgreSQL: LISTEN chat
   ↓
Subscription active
   ↓
When notification arrives:
   PostgreSQL → NotificationService → WebSocketService → Client
```

## Key Components

### NotificationService
- Manages PostgreSQL LISTEN connections
- One dedicated connection per channel
- Maintains callbacks for each channel
- Handles JSON serialization/deserialization

### WebSocketService
- Manages WebSocket connections
- Maps clients to their subscribed channels
- Forwards notifications to appropriate clients
- Handles client disconnections

### Database Triggers
- Automatically fire on INSERT/UPDATE
- Use `pg_notify()` function
- Build JSON payloads with `json_build_object()`
- Enable real-time database change notifications

## Channels

| Channel | Purpose | Trigger |
|---------|---------|---------|
| `chat` | Chat messages | chat_messages table |
| `orders` | Order updates | orders table |
| `system` | System notifications | Manual |
| `notifications` | General notifications | Manual |
| Custom | User-defined | Manual |

## Connection Types

### LISTEN Connections (NotificationService)
- Long-lived PostgreSQL connections
- One per channel
- Receive notifications via `pg_notify()`
- Automatically reconnect on failure

### Pool Connections (Publishing)
- Short-lived connections from pool
- Used for NOTIFY commands
- Released immediately after use
- Efficient for high-frequency publishing

## Scalability Considerations

### Current Architecture
- Single server instance
- In-memory channel management
- Direct PostgreSQL connections

### Scaling Options
1. **Multiple Servers**: Use Redis Pub/Sub as intermediary
2. **Load Balancer**: Sticky sessions for WebSocket
3. **Database**: PostgreSQL can handle thousands of LISTEN connections
4. **Horizontal**: Microservices per channel type

## Security Considerations

1. **Authentication**: Add JWT/session validation
2. **Authorization**: Channel-level access control
3. **Rate Limiting**: Prevent notification spam
4. **Input Validation**: Sanitize all payloads
5. **SSL/TLS**: Use wss:// for WebSocket in production
