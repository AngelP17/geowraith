/**
 * Multi-Source Downloader - Type Definitions
 */

export interface ImageSource {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  country: string;
  primaryUrl: string;
  fallbackUrls: string[];
}

export interface DownloaderConfig {
  count: number;
  output: string;
  delay: number;
}

export interface DownloadResult {
  success: boolean;
  skipped: boolean;
  filename: string;
  source: ImageSource;
}
