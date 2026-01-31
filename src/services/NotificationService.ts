import { Client } from 'pg';
import pool from '../config/database';

export interface NotificationPayload {
    channel: string;
    message: string;
    timestamp?: string;
    metadata?: Record<string, any>;
}

export class NotificationService {
    private listeners: Map<string, Client> = new Map();
    private callbacks: Map<string, Set<(payload: any) => void>> = new Map();

    /**
     * Subscribe to a PostgreSQL notification channel
     */
    async subscribe(channel: string, callback: (payload: any) => void): Promise<void> {
        try {
            // If we don't have a listener for this channel, create one
            if (!this.listeners.has(channel)) {
                const client = new Client({
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '5432'),
                    database: process.env.DB_NAME || 'pg_notify_demo',
                    user: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASSWORD || 'postgres',
                });

                await client.connect();

                // Set up notification handler
                client.on('notification', (msg) => {
                    if (msg.channel === channel) {
                        const callbacks = this.callbacks.get(channel);
                        if (callbacks) {
                            let payload: { message: string | undefined; };
                            try {
                                payload = JSON.parse(msg.payload || '{}');
                            } catch {
                                payload = { message: msg.payload };
                            }

                            callbacks.forEach(cb => cb(payload));
                        }
                    }
                });

                // Listen to the channel
                await client.query(`LISTEN ${channel}`);
                this.listeners.set(channel, client);
                this.callbacks.set(channel, new Set());

                console.log(`📡 Subscribed to channel: ${channel}`);
            }

            // Add callback to the set
            const channelCallbacks = this.callbacks.get(channel);
            if (channelCallbacks) {
                channelCallbacks.add(callback);
            }
        } catch (error) {
            console.error(`Error subscribing to channel ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from a channel
     */
    async unsubscribe(channel: string, callback?: (payload: any) => void): Promise<void> {
        if (callback) {
            // Remove specific callback
            const callbacks = this.callbacks.get(channel);
            if (callbacks) {
                callbacks.delete(callback);

                // If no more callbacks, close the listener
                if (callbacks.size === 0) {
                    await this.closeListener(channel);
                }
            }
        } else {
            // Remove all callbacks and close listener
            await this.closeListener(channel);
        }
    }

    /**
     * Publish a notification to a channel
     */
    async publish(channel: string, payload: any): Promise<void> {
        const client = await pool.connect();
        try {
            const payloadString = typeof payload === 'string'
                ? payload
                : JSON.stringify(payload);

            await client.query(`NOTIFY ${channel}, '${payloadString.replace(/'/g, "''")}'`);
            console.log(`📤 Published to ${channel}:`, payload);
        } catch (error) {
            console.error(`Error publishing to channel ${channel}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Close a specific listener
     */
    private async closeListener(channel: string): Promise<void> {
        const client = this.listeners.get(channel);
        if (client) {
            try {
                await client.query(`UNLISTEN ${channel}`);
                await client.end();
                this.listeners.delete(channel);
                this.callbacks.delete(channel);
                console.log(`🔌 Unsubscribed from channel: ${channel}`);
            } catch (error) {
                console.error(`Error closing listener for ${channel}:`, error);
            }
        }
    }

    /**
     * Close all listeners
     */
    async closeAll(): Promise<void> {
        const channels = Array.from(this.listeners.keys());
        await Promise.all(channels.map(channel => this.closeListener(channel)));
    }

    /**
     * Get list of active channels
     */
    getActiveChannels(): string[] {
        return Array.from(this.listeners.keys());
    }
}

export const notificationService = new NotificationService();
