import WatchHistory from '../models/WatchHistory.js';
import Movie from '../models/Movie.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Returns every movie the user has started, newest first.
// `continueWatching` is the unfinished subset.
export const getWatchHistory = asyncHandler(async (req, res) => {
  const entries = await WatchHistory.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate('movieId');

  const items = entries
    .filter((e) => e.movieId)
    .map((e) => ({
      ...e.movieId.toJSON(),
      playbackPosition: e.playbackPosition,
      completed: e.completed,
      watchedAt: e.updatedAt,
    }));

  res.json({ items, continueWatching: items.filter((i) => !i.completed && i.playbackPosition > 5) });
});

export const saveWatchHistory = asyncHandler(async (req, res) => {
  const { movieId, playbackPosition } = req.body;
  const movie = await Movie.findById(movieId);
  if (!movie) throw new ApiError(404, 'Movie not found');

  const totalSeconds = movie.duration * 60;
  const completed = req.body.completed === true || playbackPosition >= totalSeconds * 0.95;

  const entry = await WatchHistory.findOneAndUpdate(
    { userId: req.user._id, movieId },
    { $set: { playbackPosition: completed ? 0 : playbackPosition, completed } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ history: entry });
});
