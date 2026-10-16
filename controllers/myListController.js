import MyList from '../models/MyList.js';
import Movie from '../models/Movie.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMyList = asyncHandler(async (req, res) => {
  const entries = await MyList.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('movieId');
  const movies = entries.map((e) => e.movieId).filter(Boolean);
  res.json({ movies });
});

export const addToMyList = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  if (!(await Movie.exists({ _id: movieId }))) throw new ApiError(404, 'Movie not found');
  // upsert makes this safe to call twice
  await MyList.updateOne(
    { userId: req.user._id, movieId },
    { $setOnInsert: { userId: req.user._id, movieId } },
    { upsert: true }
  );
  res.status(201).json({ message: 'Added to My List', movieId });
});

export const removeFromMyList = asyncHandler(async (req, res) => {
  await MyList.deleteOne({ userId: req.user._id, movieId: req.params.movieId });
  res.json({ message: 'Removed from My List', movieId: req.params.movieId });
});
