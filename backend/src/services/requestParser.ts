import { ApiError } from '../errors.js';
import type { ParsedPredictInput, PredictMode, PredictRequest } from '../types.js';

const BASE64_PATTERN = /^[A-Za-z0-9+/=\s]+$/;

function normalizeMode(mode: PredictMode | undefined): PredictMode {
  return mode === 'fast' ? 'fast' : 'accurate';
}

function decodeBase64Payload(rawBase64: string): Buffer {
  const base64 = rawBase64.trim();
  if (!base64) {
    throw new ApiError(400, 'missing_input', 'image_base64 payload is empty');
  }
  if (!BASE64_PATTERN.test(base64)) {
    throw new ApiError(400, 'invalid_input', 'image_base64 contains invalid characters');
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    throw new ApiError(400, 'invalid_input', 'image_base64 could not be decoded');
  }
  return buffer;
}

function decodeDataUrlPayload(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match || !match[1]) {
    throw new ApiError(400, 'invalid_input', 'image_url must be a base64 data URL');
  }
  return decodeBase64Payload(match[1]);
}

/** Parse and validate a predict request payload into a normalized backend input. */
export function parsePredictRequest(body: PredictRequest): ParsedPredictInput {
  if (!body || (!body.image_base64 && !body.image_url)) {
    throw new ApiError(400, 'missing_input', 'Provide image_base64 or image_url');
  }

  const mode = normalizeMode(body.options?.mode);
  if (body.image_base64) {
    return {
      imageBuffer: decodeBase64Payload(body.image_base64),
      mode,
      source: 'base64',
    };
  }

  if (!body.image_url) {
    throw new ApiError(400, 'missing_input', 'Provide image_base64 or image_url');
  }
  if (!body.image_url.startsWith('data:image/')) {
    throw new ApiError(
      400,
      'invalid_input',
      'Remote image_url is disabled in local-first mode. Use image_base64 or data URL.'
    );
  }

  return {
    imageBuffer: decodeDataUrlPayload(body.image_url),
    mode,
    source: 'data_url',
  };
}
