import { Router } from 'express';
import { getWatchHistory, saveWatchHistory } from '../controllers/watchHistoryController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { historyRules } from '../middleware/validators.js';

const router = Router();
router.use(protect);
router.get('/', getWatchHistory);
router.post('/', historyRules, validate, saveWatchHistory);
export default router;
