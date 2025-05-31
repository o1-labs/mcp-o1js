import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded' });
  },
});
