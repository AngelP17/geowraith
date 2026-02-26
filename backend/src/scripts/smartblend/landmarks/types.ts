/**
 * SmartBlend landmark types.
 */

export interface LandmarkSource {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  country: string;
  /**
   * Direct URLs are unverified for license and should only be used
   * when allowUnverified is enabled.
   */
  urls: string[];
}
