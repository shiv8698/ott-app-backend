import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';

export const isR2Configured = () =>
  Boolean(
    env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey &&
    env.r2.videoBucket && env.r2.imageBucket
  );

let client;

// R2 speaks the S3 protocol, so we use the AWS S3 SDK pointed at Cloudflare.
export function getR2() {
  if (!isR2Configured()) {
    throw new ApiError(503, 'Cloud storage is not configured on the server');
  }
  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.r2.accessKeyId, secretAccessKey: env.r2.secretAccessKey },
    // Newer SDK versions add checksum parameters that R2 does not accept on presigned URLs.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return client;
}
