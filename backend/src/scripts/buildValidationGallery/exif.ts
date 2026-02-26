/**
 * EXIF/GPS verification utilities.
 */

import exifr from 'exifr';

/**
 * Verify GPS coordinates by reading EXIF data from a local image file.
 */
export async function verifyGpsWithExif(localPath: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const gps = await exifr.gps(localPath);
    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
      return null;
    }
    return { lat: gps.latitude, lon: gps.longitude };
  } catch {
    return null;
  }
}
