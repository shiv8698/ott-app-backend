import mongoose from 'mongoose';
import { jsonOptions } from '../utils/schemaOptions.js';

const watchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    playbackPosition: { type: Number, default: 0, min: 0 }, // seconds
    completed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true }, toJSON: jsonOptions }
);

// One row per user + movie
watchHistorySchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('WatchHistory', watchHistorySchema);
