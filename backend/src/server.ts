import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import supabasePlugin from './plugins/supabase';
import projectRoutes from './routes/projects';
import campaignRoutes from './routes/campaigns';
import metaRoutes from './routes/meta';

dotenv.config();

const server = fastify({ logger: true });
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultAllowedPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/marketingia(?:-[a-z0-9]+)?(?:-[a-z0-9]+)?\.onrender\.com$/,
];

// Register plugins
server.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    const matchesExplicitOrigin = allowedOrigins.some(
      (allowedOrigin) => allowedOrigin.replace(/\/$/, '') === normalizedOrigin
    );
    const matchesDefaultPattern = defaultAllowedPatterns.some((pattern) =>
      pattern.test(normalizedOrigin)
    );

    server.log.info(
      {
        requestOrigin: normalizedOrigin,
        allowedOrigins,
        matchesExplicitOrigin,
        matchesDefaultPattern,
      },
      'Evaluating CORS origin'
    );

    callback(null, matchesExplicitOrigin || matchesDefaultPattern);
  },
  credentials: true,
});

server.register(supabasePlugin);

// Register routes
server.register(projectRoutes, { prefix: '/api/projects' });
server.register(campaignRoutes, { prefix: '/api/campaigns' });
server.register(metaRoutes, { prefix: '/api/meta' });

// Health check
server.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    service: 'marketing-ai-backend',
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
