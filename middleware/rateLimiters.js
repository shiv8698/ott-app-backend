import rateLimit from 'express-rate-limit';

const make = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message },
  });

export const authLimiter = make(15, 30, 'Too many attempts. Please try again in 15 minutes.');
export const uploadLimiter = make(15, 40, 'Too many upload requests. Please slow down.');
export const playLimiter = make(15, 120, 'Too many playback requests. Please slow down.');
