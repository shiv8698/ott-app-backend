import Movie from '../models/Movie.js';
import MyList from '../models/MyList.js';
import WatchHistory from '../models/WatchHistory.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createUploadUrl, verifyUpload, publicImageUrl, imageKeyFromUrl,
  deleteVideo, deleteImage, getUploadLimits,
} from '../services/storage.service.js';

export const getUploadConfig = asyncHandler(async (req, res) => {
  res.json(getUploadLimits());
});

export const getUploadUrl = asyncHandler(async (req, res) => {
  const { kind, contentType, size } = req.body;
  res.json(await createUploadUrl({ kind, contentType, size }));
});

// Turns an uploaded image key (or a pasted URL) into the URL we store.
async function resolveImage(kind, key, url) {
  if (key) {
    await verifyUpload(kind, key);
    return publicImageUrl(key);
  }
  return url || '';
}

export const createMovie = asyncHandler(async (req, res) => {
  const b = req.body;
  const video = await verifyUpload('video', b.videoKey);

  try {
    const movie = await Movie.create({
      title: b.title,
      description: b.description,
      genre: b.genre,
      releaseYear: b.releaseYear,
      duration: b.duration,
      rating: b.rating ?? 0,
      featured: b.featured ?? false,
      posterUrl: await resolveImage('poster', b.posterKey, b.posterUrl),
      thumbnailUrl: await resolveImage('thumbnail', b.thumbnailKey, b.thumbnailUrl),
      videoStorageKey: b.videoKey,
      contentType: video.contentType,
      fileSize: video.size,
    });
    res.status(201).json({ movie });
  } catch (err) {
    await deleteVideo(b.videoKey); // do not leave an orphan file behind
    throw err;
  }
});

export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, 'Movie not found');
  const b = req.body;

  for (const field of ['title', 'description', 'genre', 'releaseYear', 'duration', 'rating', 'featured']) {
    if (b[field] !== undefined) movie[field] = b[field];
  }

  const oldImages = [];
  for (const [kind, keyField, urlField, prop] of [
    ['poster', 'posterKey', 'posterUrl', 'posterUrl'],
    ['thumbnail', 'thumbnailKey', 'thumbnailUrl', 'thumbnailUrl'],
  ]) {
    if (b[keyField] || b[urlField] !== undefined) {
      const next = await resolveImage(kind, b[keyField], b[urlField]);
      if (next !== movie[prop]) {
        oldImages.push(movie[prop]);
        movie[prop] = next;
      }
    }
  }

  await movie.save();
  for (const url of oldImages) {
    const key = imageKeyFromUrl(url);
    if (key) await deleteImage(key);
  }
  res.json({ movie });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id).select('+videoStorageKey');
  if (!movie) throw new ApiError(404, 'Movie not found');

  await Promise.all([
    movie.deleteOne(),
    MyList.deleteMany({ movieId: movie._id }),
    WatchHistory.deleteMany({ movieId: movie._id }),
  ]);

  await deleteVideo(movie.videoStorageKey);
  for (const url of [movie.posterUrl, movie.thumbnailUrl]) {
    const key = imageKeyFromUrl(url);
    if (key) await deleteImage(key);
  }
  res.json({ message: 'Movie deleted', id: movie.id });
});
