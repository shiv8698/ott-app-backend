import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Requires a valid "Authorization: Bearer <token>" header.
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  // Always read the role from the database, never trust the token alone.
  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'This account no longer exists');
  req.user = user;
  next();
});

export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin'
    ? next()
    : next(new ApiError(403, 'Administrator access is required'));
