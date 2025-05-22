import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60_000, // 1 minute window
  max: 6000000, // 60 requests per window per IP
  standardHeaders: true, // send -RateLimit-* headers
  legacyHeaders: false, // drop deprecated X-RateLimit-* headers
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded' });
  },
});
