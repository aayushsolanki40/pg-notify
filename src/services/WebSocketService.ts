import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { notificationService } from './NotificationService';

export class WebSocketService {
    private wss: WebSocketServer;
    private clientChannels: Map<WebSocket, Set<string>> = new Map();

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server, path: '/ws' });
        this.initialize();
    }

    private initialize(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('🔌 New WebSocket client connected');
            this.clientChannels.set(ws, new Set());

            ws.on('message', async (data: string) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
                this.handleDisconnect(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to notification server',
                availableChannels: ['chat', 'orders', 'notifications', 'system']
            }));
        });

        console.log('🚀 WebSocket server initialized on /ws');
    }

    private async handleMessage(ws: WebSocket, message: any): Promise<void> {
        const { type, channel, payload } = message;

        switch (type) {
            case 'subscribe':
                await this.subscribeClient(ws, channel);
                break;

            case 'unsubscribe':
                await this.unsubscribeClient(ws, channel);
                break;

            case 'publish':
                await notificationService.publish(channel, payload);
                ws.send(JSON.stringify({
                    type: 'published',
                    channel,
                    message: 'Message published successfully'
                }));
                break;

            case 'list':
                const channels = Array.from(this.clientChannels.get(ws) || []);
                ws.send(JSON.stringify({
                    type: 'channels',
                    subscribed: channels,
                    active: notificationService.getActiveChannels()
                }));
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${type}`
                }));
        }
    }

    private async subscribeClient(ws: WebSocket, channel: string): Promise<void> {
        const clientChannels = this.clientChannels.get(ws);
        if (!clientChannels) return;

        if (clientChannels.has(channel)) {
            ws.send(JSON.stringify({
                type: 'info',
                message: `Already subscribed to ${channel}`
            }));
            return;
        }

        // Create callback for this client
        const callback = (payload: any) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    channel,
                    payload,
                    timestamp: new Date().toISOString()
                }));
            }
        };

        await notificationService.subscribe(channel, callback);
        clientChannels.add(channel);

        ws.send(JSON.stringify({
            type: 'subscribed',
            channel,
            message: `Successfully subscribed to ${channel}`
        }));

        console.log(`📡 Client subscribed to channel: ${channel}`);
    }

    private async unsubscribeClient(ws: WebSocket, channel: string): Promise<void> {
        const clientChannels = this.clientChannels.get(ws);
        if (!clientChannels || !clientChannels.has(channel)) {
            ws.send(JSON.stringify({
                type: 'info',
                message: `Not subscribed to ${channel}`
            }));
            return;
        }

        clientChannels.delete(channel);

        ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel,
            message: `Successfully unsubscribed from ${channel}`
        }));

        console.log(`🔌 Client unsubscribed from channel: ${channel}`);
    }

    private handleDisconnect(ws: WebSocket): void {
        const clientChannels = this.clientChannels.get(ws);
        if (clientChannels) {
            clientChannels.clear();
            this.clientChannels.delete(ws);
        }
    }

    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: any): void {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    /**
     * Get number of connected clients
     */
    getClientCount(): number {
        return this.wss.clients.size;
    }
}
