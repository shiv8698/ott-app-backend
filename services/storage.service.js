import crypto from 'crypto';
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { getR2 } from '../config/r2.js';
import { ApiError } from '../utils/ApiError.js';

const ascii = (bytes, start, end) => String.fromCharCode(...bytes.slice(start, end));

// "Magic bytes": the first bytes of a real file identify its format.
// This is stronger than trusting the MIME type the browser reports, but it is still
// NOT proof that a file is safe. See README section "Is checking the file type enough?".
const MAGIC = {
  'video/mp4': (b) => b.length >= 12 && ascii(b, 4, 8) === 'ftyp',
  'video/webm': (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 4 && b[0] === 0x89 && ascii(b, 1, 4) === 'PNG',
  'image/webp': (b) => b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
};

const EXT = {
  'video/mp4': 'mp4', 'video/webm': 'webm',
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

// Config is a function so env values are read when needed.
const kinds = () => ({
  video: { bucket: env.r2.videoBucket, folder: 'videos', max: env.limits.maxVideoBytes, types: ['video/mp4', 'video/webm'] },
  poster: { bucket: env.r2.imageBucket, folder: 'images/poster', max: env.limits.maxImageBytes, types: ['image/jpeg', 'image/png', 'image/webp'] },
  thumbnail: { bucket: env.r2.imageBucket, folder: 'images/thumbnail', max: env.limits.maxImageBytes, types: ['image/jpeg', 'image/png', 'image/webp'] },
});

const isNotFound = (err) =>
  err?.name === 'NotFound' || err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404;

const mb = (bytes) => Math.round(bytes / 1024 / 1024);

export const getUploadLimits = () => ({
  maxVideoMB: mb(env.limits.maxVideoBytes),
  maxImageMB: mb(env.limits.maxImageBytes),
});

// Step 6 of the upload flow: create a short-lived URL the browser can PUT the file to.
export async function createUploadUrl({ kind, contentType, size }) {
  const cfg = kinds()[kind];
  if (!cfg) throw new ApiError(400, 'Unknown upload kind');
  if (!cfg.types.includes(contentType)) {
    throw new ApiError(400, `Unsupported file type. Allowed: ${cfg.types.join(', ')}`);
  }
  if (size > cfg.max) {
    throw new ApiError(413, `File is too large. Maximum size is ${mb(cfg.max)} MB.`);
  }
  if (kind !== 'video' && !env.r2.imagePublicUrl) {
    throw new ApiError(503, 'R2_IMAGE_PUBLIC_URL is not configured, so image uploads are unavailable');
  }

  // The server picks the key. Users never choose file names or folders.
  const key = `${cfg.folder}/${crypto.randomUUID()}.${EXT[contentType]}`;
  const uploadUrl = await getSignedUrl(
    getR2(),
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType }),
    { expiresIn: env.limits.uploadUrlTtl, signableHeaders: new Set(['content-type']) }
  );
  return { uploadUrl, key, expiresIn: env.limits.uploadUrlTtl, headers: { 'Content-Type': contentType } };
}

export async function deleteObject(bucket, key) {
  try {
    await getR2().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`Could not delete ${bucket}/${key}:`, err.message);
  }
}

// Step 8: after the browser says "upload finished", confirm it really exists and is valid.
export async function verifyUpload(kind, key) {
  const cfg = kinds()[kind];
  const r2 = getR2();

  let head;
  try {
    head = await r2.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
  } catch (err) {
    if (isNotFound(err)) {
      throw new ApiError(400, 'Upload not found. It may not have finished, or the upload link expired.');
    }
    throw err;
  }

  const size = head.ContentLength;
  const contentType = head.ContentType;

  if (!cfg.types.includes(contentType)) {
    await deleteObject(cfg.bucket, key);
    throw new ApiError(400, 'The uploaded file type is not allowed');
  }
  if (size > cfg.max) {
    await deleteObject(cfg.bucket, key);
    throw new ApiError(413, `The uploaded file is larger than ${mb(cfg.max)} MB`);
  }

  // Read only the first 32 bytes to check the real file signature.
  const res = await r2.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key, Range: 'bytes=0-31' }));
  const bytes = await res.Body.transformToByteArray();
  if (!MAGIC[contentType](bytes)) {
    await deleteObject(cfg.bucket, key);
    throw new ApiError(400, 'The file contents do not match its declared type');
  }
  return { size, contentType };
}

export const publicImageUrl = (key) => `${env.r2.imagePublicUrl}/${key}`;

export const imageKeyFromUrl = (url) =>
  env.r2.imagePublicUrl && url?.startsWith(`${env.r2.imagePublicUrl}/`)
    ? url.slice(env.r2.imagePublicUrl.length + 1)
    : null;

export const deleteVideo = (key) => deleteObject(env.r2.videoBucket, key);
export const deleteImage = (key) => deleteObject(env.r2.imageBucket, key);

// Step 12: a signed, expiring GET link. The bucket itself stays private.
export async function createPlaybackUrl(key) {
  const r2 = getR2();
  try {
    await r2.send(new HeadObjectCommand({ Bucket: env.r2.videoBucket, Key: key }));
  } catch (err) {
    if (isNotFound(err)) throw new ApiError(404, 'The video file for this movie is missing');
    throw err;
  }
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: env.r2.videoBucket, Key: key }),
    { expiresIn: env.limits.playbackUrlTtl }
  );
}
