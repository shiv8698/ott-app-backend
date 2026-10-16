import { Router } from 'express';
import {
  listMovies, searchMovies, getGenres, getMovie, getPlayUrl,
} from '../controllers/movieController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { playLimiter } from '../middleware/rateLimiters.js';
import { idParam, listRules, searchRules } from '../middleware/validators.js';

const router = Router();
router.get('/', listRules, validate, listMovies);
router.get('/search', searchRules, validate, searchMovies); // must come before /:id
router.get('/genres', getGenres);                           // must come before /:id
router.get('/:id', idParam, validate, getMovie);
router.post('/:id/play-url', protect, playLimiter, idParam, validate, getPlayUrl);
export default router;
