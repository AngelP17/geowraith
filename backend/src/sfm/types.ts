/**
 * SfM pipeline type definitions.
 */

export interface ImageFeatures {
  keypoints: Float32Array; // Nx2 array of [x, y] coordinates
  descriptors: Float32Array; // Nx256 array of SuperPoint descriptors
  scores: Float32Array; // Confidence scores
}

export interface FeatureMatch {
  queryIdx: number;
  trainIdx: number;
  distance: number;
}

export interface CameraPose {
  rotation: Float32Array; // 3x3 rotation matrix
  translation: Float32Array; // 3-element translation vector
  quaternion: [number, number, number, number]; // [w, x, y, z]
}

export interface Point3D {
  id: number;
  position: [number, number, number];
  color?: [number, number, number];
  observations: Observation[];
}

export interface Observation {
  imageId: string;
  featureIdx: number;
}

export interface SfMReconstruction {
  images: Map<string, CameraPose>;
  points3D: Map<number, Point3D>;
  cameraParams: CameraParams;
}

export interface CameraParams {
  focalLength: number;
  principalPoint: [number, number];
  distortion?: [number, number, number, number]; // k1, k2, p1, p2
}

export interface SfMResult {
  success: boolean;
  location: { lat: number; lon: number; accuracy_m: number };
  pose?: CameraPose;
  confidence: number;
  processingTimeMs: number;
  error?: string;
}

export interface ReferenceImage {
  id: string;
  url: string;
  coordinates: { lat: number; lon: number };
  features?: ImageFeatures;
}
