#!/bin/bash

# Test script for PostgreSQL NOTIFY/LISTEN Demo

echo "🧪 Testing PostgreSQL NOTIFY/LISTEN Demo"
echo "========================================"
echo ""

# Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start it with: npm run dev"
    exit 1
fi
echo ""

# Test health endpoint
echo "2️⃣  Testing health endpoint..."
curl -s http://localhost:3000/health | jq .
echo ""

# Test chat message
echo "3️⃣  Publishing chat message..."
curl -s -X POST http://localhost:3000/api/notifications/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user": "TestUser",
    "message": "Hello from test script!",
    "room": "general"
  }' | jq .
echo ""

# Test order update
echo "4️⃣  Publishing order update..."
curl -s -X POST http://localhost:3000/api/notifications/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-TEST-001",
    "status": "processing",
    "customerId": "CUST-TEST-123",
    "details": {
      "items": ["Product A", "Product B"],
      "total": 199.99
    }
  }' | jq .
echo ""

# Test system notification
echo "5️⃣  Publishing system notification..."
curl -s -X POST http://localhost:3000/api/notifications/system \
  -H "Content-Type: application/json" \
  -d '{
    "type": "maintenance",
    "message": "System maintenance scheduled",
    "severity": "info",
    "metadata": {
      "scheduledTime": "2024-01-01T00:00:00Z"
    }
  }' | jq .
echo ""

# Test generic notification
echo "6️⃣  Publishing generic notification..."
curl -s -X POST http://localhost:3000/api/notifications/publish \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "custom_channel",
    "payload": {
      "message": "Custom notification",
      "data": {
        "key1": "value1",
        "key2": "value2"
      }
    }
  }' | jq .
echo ""

# Get active channels
echo "7️⃣  Getting active channels..."
curl -s http://localhost:3000/api/notifications/channels | jq .
echo ""

echo "✅ All tests completed!"
echo ""
echo "💡 Tip: Open client-example.html in your browser to see real-time notifications"
echo "💡 Tip: Subscribe to channels via WebSocket to receive these notifications"
