import { Router, Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';

const router = Router();

/**
 * Publish a notification to a channel
 * POST /api/notifications/publish
 */
router.post('/publish', async (req: Request, res: Response) => {
    try {
        const { channel, payload } = req.body;

        if (!channel) {
            return res.status(400).json({
                error: 'Channel is required'
            });
        }

        await notificationService.publish(channel, payload || {});

        res.json({
            success: true,
            message: `Notification published to ${channel}`,
            channel,
            payload
        });
    } catch (error) {
        console.error('Error publishing notification:', error);
        res.status(500).json({
            error: 'Failed to publish notification',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Get list of active channels
 * GET /api/notifications/channels
 */
router.get('/channels', (req: Request, res: Response) => {
    const channels = notificationService.getActiveChannels();
    res.json({
        channels,
        count: channels.length
    });
});

/**
 * Publish a chat message
 * POST /api/notifications/chat
 */
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { user, message, room } = req.body;

        if (!user || !message) {
            return res.status(400).json({
                error: 'User and message are required'
            });
        }

        const payload = {
            user,
            message,
            room: room || 'general',
            timestamp: new Date().toISOString()
        };

        await notificationService.publish('chat', payload);

        res.json({
            success: true,
            message: 'Chat message sent',
            payload
        });
    } catch (error) {
        console.error('Error sending chat message:', error);
        res.status(500).json({
            error: 'Failed to send chat message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Publish an order update
 * POST /api/notifications/order
 */
router.post('/order', async (req: Request, res: Response) => {
    try {
        const { orderId, status, customerId, details } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                error: 'Order ID and status are required'
            });
        }

        const payload = {
            orderId,
            status,
            customerId,
            details,
            timestamp: new Date().toISOString()
        };

        await notificationService.publish('orders', payload);

        res.json({
            success: true,
            message: 'Order update sent',
            payload
        });
    } catch (error) {
        console.error('Error sending order update:', error);
        res.status(500).json({
            error: 'Failed to send order update',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Publish a system notification
 * POST /api/notifications/system
 */
router.post('/system', async (req: Request, res: Response) => {
    try {
        const { type, message, severity, metadata } = req.body;

        if (!type || !message) {
            return res.status(400).json({
                error: 'Type and message are required'
            });
        }

        const payload = {
            type,
            message,
            severity: severity || 'info',
            metadata,
            timestamp: new Date().toISOString()
        };

        await notificationService.publish('system', payload);

        res.json({
            success: true,
            message: 'System notification sent',
            payload
        });
    } catch (error) {
        console.error('Error sending system notification:', error);
        res.status(500).json({
            error: 'Failed to send system notification',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
