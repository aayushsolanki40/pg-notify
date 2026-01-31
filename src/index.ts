import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import { WebSocketService } from './services/WebSocketService';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'PostgreSQL NOTIFY/LISTEN Demo API',
        version: '1.0.0',
        endpoints: {
            websocket: 'ws://localhost:' + PORT + '/ws',
            api: {
                publish: 'POST /api/notifications/publish',
                chat: 'POST /api/notifications/chat',
                order: 'POST /api/notifications/order',
                system: 'POST /api/notifications/system',
                channels: 'GET /api/notifications/channels'
            }
        },
        documentation: {
            websocket: {
                subscribe: { type: 'subscribe', channel: 'channel_name' },
                unsubscribe: { type: 'unsubscribe', channel: 'channel_name' },
                publish: { type: 'publish', channel: 'channel_name', payload: {} },
                list: { type: 'list' }
            }
        }
    });
});

app.get('/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
});

// Start server
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log('🚀 ========================================');
    console.log('');
});

export default app;
