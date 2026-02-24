const DEFAULT_API_PORT = 8080;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return fallback;
}

export const config = {
  apiPort: parseInteger(process.env.GEOWRAITH_API_PORT, DEFAULT_API_PORT),
  maxImageBytes: parseInteger(process.env.GEOWRAITH_MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES),
  offlineMode: parseBoolean(process.env.GEOWRAITH_OFFLINE, true),
};
