import mongoose from 'mongoose';
import { jsonOptions } from '../utils/schemaOptions.js';

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    genre: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      validate: [(v) => v.length >= 1 && v.length <= 5, 'Provide between 1 and 5 genres'],
    },
    releaseYear: { type: Number, required: true, min: 1888, max: new Date().getFullYear() + 1 },
    duration: { type: Number, required: true, min: 1, max: 1000 }, // minutes
    posterUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    // Where the video lives in R2. Hidden from normal queries (select: false).
    videoStorageKey: { type: String, required: true, unique: true, select: false },
    contentType: { type: String, required: true, enum: ['video/mp4', 'video/webm'] },
    fileSize: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: jsonOptions }
);

movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ createdAt: -1 });
movieSchema.index({ views: -1 });
movieSchema.index({ featured: 1 });

export default mongoose.model('Movie', movieSchema);
