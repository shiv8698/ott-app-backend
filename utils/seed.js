// Run with: npm run seed
// Creates the first admin account and some demo movies so the UI is not empty.
// Demo movies point at a video file that does not exist, so playing them shows the
// "video file is missing" message. Upload real movies from the Admin Dashboard.
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';

await connectDB();

const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
if (!(await User.exists({ email }))) {
  await User.create({
    name: process.env.ADMIN_NAME || 'Site Admin',
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123', 12),
    role: 'admin',
  });
  console.log(`Admin created: ${email}`);
} else {
  console.log(`Admin already exists: ${email}`);
}

if ((await Movie.countDocuments()) === 0) {
  const demo = [
    ['Midnight Harbor', 'A night-shift ferry pilot uncovers a smuggling ring hidden in plain sight.', ['Thriller', 'Drama'], 2023, 118, 8.1, true],
    ['The Last Signal', 'A lone radio operator on a polar station hears a message from the future.', ['Sci-Fi', 'Thriller'], 2024, 126, 8.4, true],
    ['Paper Lanterns', 'Two rival lantern makers fall for each other during a festival week.', ['Romance', 'Drama'], 2022, 104, 7.6, false],
    ['Rooftop Rules', 'A crew of delivery riders turns a city rooftop into their private racetrack.', ['Action', 'Comedy'], 2021, 98, 7.2, false],
    ['Salt & Ember', 'A retired chef returns to her village to save its failing kitchen.', ['Drama', 'Comedy'], 2020, 112, 7.9, false],
    ['Deep Field', 'A documentary following three astronomers hunting for the oldest light in the universe.', ['Documentary'], 2024, 88, 8.6, false],
    ['Iron Monsoon', 'A rescue team races a record storm to reach a stranded mountain village.', ['Action', 'Drama'], 2023, 131, 7.8, false],
    ['Quiet Orbit', 'Two astronauts share a broken module and a shared secret.', ['Sci-Fi', 'Romance'], 2025, 109, 7.5, false],
    ['Laugh Track', 'An unlucky comedian discovers his jokes only work when he tells the truth.', ['Comedy'], 2022, 95, 7.0, false],
    ['Glass Alley', 'A detective with no memory of last week must solve her own disappearance.', ['Thriller'], 2025, 121, 8.0, false],
    ['Wild Currents', 'A documentary tracing one river from glacier to sea.', ['Documentary', 'Drama'], 2021, 92, 8.2, false],
    ['Backstage Hearts', 'Two stagehands run a theater and a quiet love story behind the curtain.', ['Romance', 'Comedy'], 2023, 101, 7.3, false],
  ];
  await Movie.insertMany(
    demo.map(([title, description, genre, releaseYear, duration, rating, featured], i) => ({
      title, description, genre, releaseYear, duration, rating, featured,
      views: Math.floor(Math.random() * 500),
      posterUrl: `https://picsum.photos/seed/reel-poster-${i}/400/600`,
      thumbnailUrl: `https://picsum.photos/seed/reel-wide-${i}/1280/720`,
      videoStorageKey: `videos/demo-${String(i).padStart(2, '0')}-missing.mp4`,
      contentType: 'video/mp4',
    }))
  );
  console.log(`Inserted ${demo.length} demo movies`);
} else {
  console.log('Movies already exist, skipping demo data');
}

await mongoose.disconnect();
