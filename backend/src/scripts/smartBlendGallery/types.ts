/**
 * SmartBlend Gallery - Type definitions
 */

export interface LandmarkSource {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  urls: string[];
}

export interface GalleryImage {
  id: string;
  source: string;
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
    categories: string[];
  };
}

export interface GalleryStats {
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
}

export interface GalleryManifest {
  images: GalleryImage[];
  stats: GalleryStats;
  created_at: string;
}

export interface DownloadResult {
  ok: boolean;
  source: string;
  filePath: string;
  usedUrl: string;
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  mime: string;
}
