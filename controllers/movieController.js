import Movie from '../models/Movie.js';
import WatchHistory from '../models/WatchHistory.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createPlaybackUrl } from '../services/storage.service.js';

const SORTS = {
  latest: { createdAt: -1 },
  trending: { views: -1, createdAt: -1 },
  popular: { rating: -1, views: -1 },
  year: { releaseYear: -1, createdAt: -1 },
  title: { title: 1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Case-insensitive exact genre match
const genreFilter = (g) => ({ $regex: `^${escapeRegex(g)}$`, $options: 'i' });

export const listMovies = asyncHandler(async (req, res) => {
  const { genre, sort = 'latest', featured } = req.query;
  const limit = req.query.limit || 20;
  const page = req.query.page || 1;

  const filter = {};
  if (genre) filter.genre = genreFilter(genre);
  if (featured !== undefined) filter.featured = featured;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit),
    Movie.countDocuments(filter),
  ]);
  res.json({ movies, page, total, totalPages: Math.ceil(total / limit) });
});

export const searchMovies = asyncHandler(async (req, res) => {
  const { q, genre } = req.query;
  const filter = {};
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ title: rx }, { genre: rx }];
  }
  if (genre) filter.genre = genreFilter(genre);

  const movies = await Movie.find(filter).sort({ views: -1, createdAt: -1 }).limit(60);
  res.json({ movies, total: movies.length });
});

export const getGenres = asyncHandler(async (req, res) => {
  const genres = await Movie.distinct('genre');
  res.json({ genres: genres.sort((a, b) => a.localeCompare(b)) });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, 'Movie not found');
  res.json({ movie });
});

// Steps 11-12 of the playback flow
export const getPlayUrl = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id).select('+videoStorageKey');
  if (!movie) throw new ApiError(404, 'Movie not found');

  // Authorization: protect() already guarantees a logged-in user.
  // Add subscription / age-rating checks here if you ever need them.
  const url = await createPlaybackUrl(movie.videoStorageKey);

  Movie.updateOne({ _id: movie._id }, { $inc: { views: 1 } }).catch(() => {});
  const history = await WatchHistory.findOne({ userId: req.user._id, movieId: movie._id });
  const resumeAt = history && !history.completed ? history.playbackPosition : 0;

  res.json({ url, expiresIn: env.limits.playbackUrlTtl, resumeAt });
});
