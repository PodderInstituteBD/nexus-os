import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.js';
import teamRoutes from './server/routes/teams.js';
import projectRoutes from './server/routes/projects.js';
import taskRoutes from './server/routes/tasks.js';
import githubRoutes from './server/routes/github.js';
import aiRoutes from './server/routes/ai.js';
import fileRoutes from './server/routes/files.js';
import analyticsRoutes from './server/routes/analytics.js';
import notificationRoutes from './server/routes/notifications.js';
import devlabRoutes from './server/routes/devlab.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Security and CORS headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes
  const handleHealth = (req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      service: 'NEXUS OS Unified Gateway',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api/health', handleHealth);
  app.get('/api/v1/health', handleHealth);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/teams', teamRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/github', githubRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/files', fileRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/devlab', devlabRoutes);

  // 404 handler for unhandled API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.path}`,
      status: 404
    });
  });

  // Global API Error Handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]:', err);
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({
        error: 'Invalid JSON request payload format.',
        status: 400
      });
      return;
    }
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      status: err.status || 500
    });
  });

  // Vite Middleware in Development, Static Serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXUS OS Gateway listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
