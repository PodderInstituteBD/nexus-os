import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const notifications = db.getNotifications(req.user!.id);
  res.json({ notifications });
});

router.patch('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const success = db.markNotificationRead(req.params.id, req.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Notification not found.' });
    return;
  }
  res.json({ success: true });
});

router.post('/mark-all-read', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const count = db.markAllNotificationsRead(req.user!.id);
  res.json({ success: true, count });
});

router.post('/test', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const notif = db.addNotification({
    userId: req.user!.id,
    title: 'System Telemetry Heartbeat',
    message: 'Diagnostics SSE pipeline verified at ' + new Date().toLocaleTimeString(),
    type: 'SYSTEM',
    read: false,
    link: '/diagnostics'
  });
  res.json({ success: true, notification: notif });
});

// SSE Real-time stream
router.get('/stream', (req, res): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const listener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  db.subscribeSSE(listener);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    db.unsubscribeSSE(listener);
  });
});

export default router;
