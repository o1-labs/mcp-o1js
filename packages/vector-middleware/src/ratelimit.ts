import rateLimit from 'express-rate-limit';
import { config } from './config.js';

export const globalLimiter = rateLimit({
  windowMs: config.windowAsMs,
  max: config.maxRequestsPerWindow,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded' });
  },
});
