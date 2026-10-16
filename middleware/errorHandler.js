import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 422;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    message = 'That record already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    status = 503;
    message = 'The database is temporarily unavailable';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd && !err.isOperational) message = 'Internal server error';
  }

  res.status(status).json({
    status: 'error',
    message,
    ...(details && { details }),
    ...(!env.isProd && status >= 500 && { stack: err.stack }),
  });
};
