import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { registerRules, loginRules, updateProfileRules } from '../middleware/validators.js';

const router = Router();
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/me', protect, authLimiter, updateProfileRules, validate, updateMe);
export default router;
