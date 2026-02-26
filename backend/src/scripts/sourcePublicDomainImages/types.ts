/**
 * Types for public domain image sourcing
 */

export interface SourcedImage {
  id: string;
  filename: string;
  url: string;
  source: string;
  lat: number;
  lon: number;
  label: string;
  country: string;
  continent: string;
  category: 'landmark' | 'urban' | 'nature' | 'coastal';
}

export interface CliOptions {
  count: string;
  source: string;
  output: string;
  cooldown: string;
}

export interface Config {
  outputDir: string;
  imagesDir: string;
  csvFile: string;
  targetCount: number;
  cooldownMs: number;
}

export interface DownloadResult {
  success: boolean;
  skipped?: boolean;
}

export interface ProcessImageOptions {
  image: SourcedImage;
  imagePath: string;
  cooldownMs: number;
  index: number;
  total: number;
}

export interface ProcessImageResult {
  success: boolean;
  csvLine: string | null;
}
