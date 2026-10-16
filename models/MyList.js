import mongoose from 'mongoose';
import { jsonOptions } from '../utils/schemaOptions.js';

const myListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions }
);

myListSchema.index({ userId: 1, movieId: 1 }, { unique: true });
myListSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('MyList', myListSchema);
