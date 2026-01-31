# Example Use Cases

This document provides practical examples of how to use the PostgreSQL NOTIFY/LISTEN pub/sub system.

## Use Case 1: Real-Time Chat Application

### Scenario
Build a chat application where messages are instantly delivered to all users in a room.

### Implementation

#### 1. Subscribe to Chat Channel (WebSocket)
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Subscribe to chat channel
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'chat'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification' && data.channel === 'chat') {
    displayMessage(data.payload);
  }
};
```

#### 2. Send Message (REST API)
```javascript
async function sendMessage(user, message, room) {
  const response = await fetch('http://localhost:3000/api/notifications/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, message, room })
  });
  return response.json();
}
```

#### 3. Database-Triggered Messages
```sql
-- Insert directly into database
INSERT INTO chat_messages (user_name, message, room)
VALUES ('Alice', 'Hello everyone!', 'general');

-- Trigger automatically sends notification to 'chat' channel
```

---

## Use Case 2: E-Commerce Order Tracking

### Scenario
Notify customers in real-time when their order status changes.

### Implementation

#### 1. Customer Dashboard (Frontend)
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to orders channel
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'orders'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification' && data.channel === 'orders') {
    const { orderId, status, customerId } = data.payload;
    
    // Only show notifications for this customer
    if (customerId === currentUser.id) {
      showNotification(`Order ${orderId} is now ${status}`);
      updateOrderStatus(orderId, status);
    }
  }
};
```

#### 2. Update Order Status (Backend)
```javascript
async function updateOrderStatus(orderId, newStatus) {
  const response = await fetch('http://localhost:3000/api/notifications/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      status: newStatus,
      customerId: 'CUST-123',
      details: {
        estimatedDelivery: '2024-01-15',
        trackingNumber: 'TRACK-789'
      }
    })
  });
  return response.json();
}
```

#### 3. Database Trigger
```sql
-- Update order status
UPDATE orders 
SET status = 'shipped', 
    updated_at = NOW()
WHERE order_id = 'ORD-123';

-- Trigger automatically notifies all subscribers
```

---

## Use Case 3: System Monitoring Dashboard

### Scenario
Display real-time system alerts and metrics on a monitoring dashboard.

### Implementation

#### 1. Monitoring Dashboard
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to system channel
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'system'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification' && data.channel === 'system') {
    const { type, message, severity, metadata } = data.payload;
    
    // Display alert based on severity
    switch (severity) {
      case 'critical':
        showCriticalAlert(message);
        break;
      case 'warning':
        showWarning(message);
        break;
      case 'info':
        showInfo(message);
        break;
    }
  }
};
```

#### 2. Send System Alert
```javascript
async function sendSystemAlert(type, message, severity = 'info') {
  const response = await fetch('http://localhost:3000/api/notifications/system', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      message,
      severity,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'monitoring-service',
        hostname: 'server-01'
      }
    })
  });
  return response.json();
}

// Usage
await sendSystemAlert('cpu', 'CPU usage above 90%', 'warning');
await sendSystemAlert('disk', 'Disk space critical', 'critical');
```

---

## Use Case 4: Collaborative Document Editing

### Scenario
Multiple users editing the same document with real-time updates.

### Implementation

#### 1. Create Custom Channel
```javascript
const documentId = 'doc-123';
const channel = `document_${documentId}`;

// Subscribe to document-specific channel
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: channel
}));
```

#### 2. Broadcast Changes
```javascript
async function broadcastDocumentChange(documentId, userId, change) {
  const response = await fetch('http://localhost:3000/api/notifications/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: `document_${documentId}`,
      payload: {
        userId,
        change,
        timestamp: new Date().toISOString()
      }
    })
  });
  return response.json();
}

// Usage
await broadcastDocumentChange('doc-123', 'user-456', {
  type: 'insert',
  position: 100,
  content: 'Hello World'
});
```

#### 3. Receive Changes
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    const { userId, change } = data.payload;
    
    // Don't apply own changes
    if (userId !== currentUser.id) {
      applyChange(change);
    }
  }
};
```

---

## Use Case 5: Live Sports Scores

### Scenario
Push live score updates to all users watching a game.

### Implementation

#### 1. Subscribe to Game
```javascript
const gameId = 'game-789';
const channel = `game_${gameId}`;

ws.send(JSON.stringify({
  type: 'subscribe',
  channel: channel
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    const { eventType, team, score, time } = data.payload;
    
    switch (eventType) {
      case 'goal':
        showGoalAnimation(team);
        updateScore(score);
        break;
      case 'penalty':
        showPenaltyNotification(team);
        break;
      case 'final':
        showFinalScore(score);
        break;
    }
  }
};
```

#### 2. Update Score
```javascript
async function updateGameScore(gameId, eventType, data) {
  const response = await fetch('http://localhost:3000/api/notifications/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: `game_${gameId}`,
      payload: {
        eventType,
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  });
  return response.json();
}

// Usage
await updateGameScore('game-789', 'goal', {
  team: 'Team A',
  player: 'John Doe',
  score: { teamA: 2, teamB: 1 },
  time: '45:23'
});
```

---

## Use Case 6: IoT Device Monitoring

### Scenario
Monitor IoT devices and receive alerts when sensor values exceed thresholds.

### Implementation

#### 1. Device Monitoring
```javascript
// Subscribe to device channel
const deviceId = 'sensor-001';
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: `device_${deviceId}`
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    const { sensorType, value, threshold, status } = data.payload;
    
    if (status === 'alert') {
      showAlert(`${sensorType} value ${value} exceeds threshold ${threshold}`);
    }
    
    updateChart(sensorType, value);
  }
};
```

#### 2. Send Sensor Data
```javascript
async function sendSensorReading(deviceId, sensorType, value, threshold) {
  const status = value > threshold ? 'alert' : 'normal';
  
  const response = await fetch('http://localhost:3000/api/notifications/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: `device_${deviceId}`,
      payload: {
        sensorType,
        value,
        threshold,
        status,
        timestamp: new Date().toISOString()
      }
    })
  });
  return response.json();
}

// Usage
await sendSensorReading('sensor-001', 'temperature', 85, 80);
```

---

## Use Case 7: Stock Price Ticker

### Scenario
Display real-time stock price updates.

### Implementation

#### 1. Subscribe to Stock Updates
```javascript
const stocks = ['AAPL', 'GOOGL', 'MSFT'];

stocks.forEach(symbol => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: `stock_${symbol}`
  }));
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    const { symbol, price, change, changePercent } = data.payload;
    updateStockPrice(symbol, price, change, changePercent);
  }
};
```

#### 2. Publish Price Update
```javascript
async function updateStockPrice(symbol, price, previousPrice) {
  const change = price - previousPrice;
  const changePercent = ((change / previousPrice) * 100).toFixed(2);
  
  const response = await fetch('http://localhost:3000/api/notifications/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: `stock_${symbol}`,
      payload: {
        symbol,
        price,
        change,
        changePercent,
        timestamp: new Date().toISOString()
      }
    })
  });
  return response.json();
}
```

---

## Best Practices

### 1. Channel Naming
- Use descriptive names: `chat`, `orders`, `user_123`
- Use prefixes for categories: `game_`, `device_`, `stock_`
- Keep names lowercase and use underscores

### 2. Payload Structure
- Always include a timestamp
- Use consistent field names
- Keep payloads small (< 8KB recommended)
- Use JSON for complex data

### 3. Error Handling
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Implement reconnection logic
};

ws.onclose = () => {
  console.log('Connection closed, reconnecting...');
  setTimeout(connect, 1000);
};
```

### 4. Subscription Management
```javascript
// Track subscriptions
const subscriptions = new Set();

function subscribe(channel) {
  if (!subscriptions.has(channel)) {
    ws.send(JSON.stringify({ type: 'subscribe', channel }));
    subscriptions.add(channel);
  }
}

function unsubscribe(channel) {
  if (subscriptions.has(channel)) {
    ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    subscriptions.delete(channel);
  }
}
```

### 5. Performance
- Unsubscribe from channels when not needed
- Use channel-specific subscriptions instead of wildcards
- Batch updates when possible
- Implement client-side throttling for high-frequency updates

---

## Testing Examples

### Test with curl
```bash
# Test chat
curl -X POST http://localhost:3000/api/notifications/chat \
  -H "Content-Type: application/json" \
  -d '{"user":"Alice","message":"Hello!","room":"general"}'

# Test orders
curl -X POST http://localhost:3000/api/notifications/order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-123","status":"shipped","customerId":"CUST-456"}'

# Test custom channel
curl -X POST http://localhost:3000/api/notifications/publish \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel","payload":{"data":"test"}}'
```

### Test with Node.js
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected');
  
  // Subscribe
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'chat'
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data));
});
```
