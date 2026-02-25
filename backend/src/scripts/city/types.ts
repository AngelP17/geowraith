export interface CityImage {
  title: string;
  url: string;
  width: number;
  height: number;
  size: number;
  source: string;
}

export interface CityScrapeConfig {
  cityName: string;
  category: string;
  count: number;
  outputDir: string;
  imagesDir: string;
  sources: string[];
  licenses: string[];
  dryRun: boolean;
}

export interface CityBatchResult {
  images: CityImage[];
  continueToken?: string;
}
