import { Router } from 'express';
import {
  getUploadConfig, getUploadUrl, createMovie, updateMovie, deleteMovie,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import { idParam, uploadUrlRules, createMovieRules, updateMovieRules } from '../middleware/validators.js';

const router = Router();
// Every route below requires a logged-in administrator.
router.use(protect, adminOnly);

router.get('/upload-config', getUploadConfig);
router.post('/upload-url', uploadLimiter, uploadUrlRules, validate, getUploadUrl);
router.post('/movies', createMovieRules, validate, createMovie);
router.put('/movies/:id', updateMovieRules, validate, updateMovie);
router.delete('/movies/:id', idParam, validate, deleteMovie);
export default router;
