import { body, param, query } from 'express-validator';

const thisYear = new Date().getFullYear();

const strongPassword = (chain) =>
  chain
    .isString().withMessage('Password is required')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number');

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  strongPassword(body('password')),
];

export const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('email').optional().trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('currentPassword').optional().isString(),
  strongPassword(body('newPassword').optional()),
];

export const idParam = [param('id').isMongoId().withMessage('Invalid movie id')];
export const movieIdParam = [param('movieId').isMongoId().withMessage('Invalid movie id')];

export const listRules = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('sort').optional().isIn(['latest', 'trending', 'popular', 'year', 'title']),
  query('featured').optional().isBoolean().toBoolean(),
  query('genre').optional().isString().trim().isLength({ max: 30 }),
];

export const searchRules = [
  query('q').optional().isString().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('genre').optional().isString().trim().isLength({ max: 30 }),
];

export const uploadUrlRules = [
  body('kind').isIn(['video', 'poster', 'thumbnail']).withMessage('kind must be video, poster or thumbnail'),
  body('contentType').isString().withMessage('contentType is required'),
  body('size').isInt({ min: 1 }).withMessage('size must be a positive number of bytes').toInt(),
];

const movieFields = (isUpdate) => {
  const f = (chain) => (isUpdate ? chain.optional() : chain);
  const url = { protocols: ['http', 'https'], require_protocol: true };
  return [
    f(body('title')).trim().isLength({ min: 1, max: 120 }).withMessage('Title is required (max 120 characters)'),
    f(body('description')).trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 characters)'),
    f(body('genre')).isArray({ min: 1, max: 5 }).withMessage('Provide 1 to 5 genres'),
    body('genre.*').trim().isLength({ min: 1, max: 30 }).withMessage('Each genre must be 1 to 30 characters'),
    f(body('releaseYear')).isInt({ min: 1888, max: thisYear + 1 }).withMessage('Enter a valid release year').toInt(),
    f(body('duration')).isInt({ min: 1, max: 1000 }).withMessage('Duration must be 1 to 1000 minutes').toInt(),
    body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('Rating must be 0 to 10').toFloat(),
    body('featured').optional().isBoolean().toBoolean(),
    body('posterKey').optional({ values: 'falsy' }).matches(/^images\/poster\/[\w-]+\.(jpg|png|webp)$/).withMessage('Invalid poster key'),
    body('thumbnailKey').optional({ values: 'falsy' }).matches(/^images\/thumbnail\/[\w-]+\.(jpg|png|webp)$/).withMessage('Invalid thumbnail key'),
    body('posterUrl').optional({ values: 'falsy' }).isURL(url).withMessage('Poster URL must start with http:// or https://'),
    body('thumbnailUrl').optional({ values: 'falsy' }).isURL(url).withMessage('Thumbnail URL must start with http:// or https://'),
  ];
};

export const createMovieRules = [
  ...movieFields(false),
  body('videoKey')
    .matches(/^videos\/[0-9a-f-]{36}\.(mp4|webm)$/)
    .withMessage('A valid uploaded video key is required'),
];
export const updateMovieRules = [...idParam, ...movieFields(true)];

export const historyRules = [
  body('movieId').isMongoId().withMessage('Invalid movie id'),
  body('playbackPosition').isFloat({ min: 0 }).withMessage('playbackPosition must be 0 or more').toFloat(),
  body('completed').optional().isBoolean().toBoolean(),
];
