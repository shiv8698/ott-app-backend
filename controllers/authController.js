import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const SALT_ROUNDS = 12;
// Used so a login for an unknown email takes the same time as one for a known email.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', SALT_ROUNDS);

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // The role is never taken from the request: everyone who registers is a normal user.
  const user = await User.create({ name, email, passwordHash, role: 'user' });
  res.status(201).json({ token: signToken(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) throw new ApiError(401, 'Invalid email or password');
  res.json({ token: signToken(user), user });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  const changingEmail = email && email !== user.email;
  if (changingEmail || newPassword) {
    // Sensitive changes need the current password. 403 (not 401) so the app does not log you out.
    const ok = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!ok) throw new ApiError(403, 'Current password is required and must be correct');
  }
  if (name) user.name = name;
  if (changingEmail) {
    if (await User.exists({ email, _id: { $ne: user._id } })) {
      throw new ApiError(409, 'That email is already in use');
    }
    user.email = email;
  }
  if (newPassword) user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await user.save();
  res.json({ user });
});
