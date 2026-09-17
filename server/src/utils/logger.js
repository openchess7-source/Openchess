import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';

// Pretty-printed in dev for readability; plain JSON in prod so it's
// machine-parseable by whatever log aggregator ends up reading it.
export const logger = pino(
  isProd
    ? { level: process.env.LOG_LEVEL || 'info' }
    : {
        level: process.env.LOG_LEVEL || 'debug',
        transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
      }
);

// Request-scoped middleware: logs every request with a unique id, method,
// path, status, and duration — replaces the previous console.log-only
// approach so production issues are actually traceable.
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Never log request bodies — they can contain passwords.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
  },
});
