import { Router } from 'express';
import { getMyList, addToMyList, removeFromMyList } from '../controllers/myListController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { movieIdParam } from '../middleware/validators.js';

const router = Router();
router.use(protect);
router.get('/', getMyList);
router.post('/:movieId', movieIdParam, validate, addToMyList);
router.delete('/:movieId', movieIdParam, validate, removeFromMyList);
export default router;
