/**
 * Type definitions for the validation gallery builder.
 */

export interface WikimediaImage {
  name: string;
  url: string;
  descriptionurl: string;
  size: number;
  width: number;
  height: number;
  mime: string;
  extmetadata?: {
    GPSLatitude?: { value: string };
    GPSLongitude?: { value: string };
    GPSAltitude?: { value: string };
    ObjectName?: { value: string };
    ImageDescription?: { value: string };
    Artist?: { value: string };
    DateTimeOriginal?: { value: string };
    Categories?: { value: string };
  };
}

export interface WikimediaApiResponse {
  batchcomplete?: string;
  continue?: {
    aicontinue?: string;
    continue?: string;
  };
  query?: {
    allimages?: WikimediaImage[];
  };
}

export interface GalleryImage {
  id: string;
  source: 'wikimedia_commons' | 'manual' | 'demo';
  filename: string;
  url: string;
  local_path: string;
  coordinates: { lat: number; lon: number };
  accuracy_radius: number;
  image_info: {
    width: number;
    height: number;
    size_bytes: number;
    mime_type: string;
  };
  metadata: {
    title: string;
    description?: string;
    artist?: string;
    capture_date?: string;
    categories: string[];
  };
}

export interface GalleryManifest {
  images: GalleryImage[];
  stats: {
    total: number;
    by_continent: Record<string, number>;
    by_country_estimate: Record<string, number>;
    by_scene_type: {
      urban: number;
      rural: number;
      landmark: number;
      nature: number;
      unknown: number;
    };
  };
  created_at: string;
}
