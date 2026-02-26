/**
 * SfM Pipeline - Main entry point for Structure-from-Motion refinement.
 * 
 * This pipeline takes a query image and coarse location estimate,
 * retrieves nearby reference images, performs SfM reconstruction,
 * and returns a precise geolocation.
 */

import type {
  SfMResult,
  ReferenceImage,
  SfMReconstruction,
} from './types.js';
import { extractFeatures, extractFeaturesBatch } from './featureExtractor.js';
import { matchFeatures, geometricVerification } from './featureMatcher.js';
import { buildReconstruction } from './reconstruction.js';
import { poseToGPS } from './gps.js';
import { retrieveMapillaryImages, downloadMapillaryImage } from './mapillary.js';

export interface SfMPipelineOptions {
  coarseLocation: { lat: number; lon: number };
  radiusMeters: number;
  maxReferences: number;
}

/**
 * Run SfM refinement pipeline.
 */
export async function runSfMPipeline(
  queryImage: Buffer,
  options: SfMPipelineOptions
): Promise<SfMResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Extract features from query image
    console.log('[SfM] Extracting features from query image...');
    const queryFeatures = await extractFeatures(queryImage);
    
    // Step 2: Retrieve nearby reference images
    console.log('[SfM] Retrieving reference images...');
    const references = await retrieveReferenceImages(
      options.coarseLocation,
      options.radiusMeters,
      options.maxReferences
    );
    
    if (references.length < 3) {
      return {
        success: false,
        location: { ...options.coarseLocation, accuracy_m: 0 },
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: 'Insufficient reference images for SfM',
      };
    }
    
    // Step 3: Extract features from reference images
    console.log(`[SfM] Extracting features from ${references.length} references...`);
    const referenceBuffers = await Promise.all(
      references.map(ref => fetchImageBuffer(ref.url))
    );
    const referenceFeatures = await extractFeaturesBatch(referenceBuffers);
    
    // Store features with IDs
    const featuresMap = new Map<string, typeof queryFeatures>();
    featuresMap.set('query', queryFeatures);
    references.forEach((ref, i) => {
      featuresMap.set(ref.id, referenceFeatures[i]);
    });
    
    // Step 4: Match features between query and references
    console.log('[SfM] Matching features...');
    const matches = new Map<string, ReturnType<typeof matchFeatures>>();
    
    for (const ref of references) {
      const refFeatures = featuresMap.get(ref.id)!;
      
      // Match query to reference
      const initialMatches = matchFeatures(queryFeatures, refFeatures);
      
      // Geometric verification
      const verifiedMatches = geometricVerification(
        queryFeatures, refFeatures, initialMatches
      );
      
      if (verifiedMatches.length >= 10) {
        matches.set(`query-${ref.id}`, verifiedMatches);
      }
    }
    
    if (matches.size < 2) {
      return {
        success: false,
        location: { ...options.coarseLocation, accuracy_m: 0 },
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: 'Insufficient feature matches for reconstruction',
      };
    }
    
    // Step 5: Build 3D reconstruction
    console.log('[SfM] Building 3D reconstruction...');
    const imageIds = ['query', ...references.map(r => r.id)];
    const reconstruction = buildReconstruction(imageIds, featuresMap, matches);
    
    if (reconstruction.images.size < 3) {
      return {
        success: false,
        location: { ...options.coarseLocation, accuracy_m: 0 },
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: 'Reconstruction failed: insufficient cameras',
      };
    }
    
    // Step 6: Convert pose to GPS
    console.log('[SfM] Converting to GPS coordinates...');
    const queryPose = reconstruction.images.get('query')!;
    const referencePoses = references
      .filter(ref => reconstruction.images.has(ref.id))
      .map(ref => ({
        pose: reconstruction.images.get(ref.id)!,
        gps: ref.coordinates,
      }));
    
    const location = poseToGPS(queryPose, referencePoses);
    
    // Calculate confidence based on reconstruction quality
    const confidence = calculateConfidence(
      matches,
      reconstruction,
      referencePoses.length
    );
    
    const processingTimeMs = Date.now() - startTime;
    
    console.log(`[SfM] Complete in ${processingTimeMs}ms`);
    console.log(`[SfM] Location: ${location.lat}, ${location.lon} (±${location.accuracy_m}m)`);
    console.log(`[SfM] Confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      success: true,
      location,
      pose: queryPose,
      confidence,
      processingTimeMs,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      location: { ...options.coarseLocation, accuracy_m: 0 },
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Retrieve reference images near the coarse location.
 * Uses Mapillary API for street-level imagery.
 */
async function retrieveReferenceImages(
  location: { lat: number; lon: number },
  radiusMeters: number,
  maxImages: number
): Promise<ReferenceImage[]> {
  // Query Mapillary for street-level images
  console.log(`[SfM] Querying Mapillary for images near ${location.lat}, ${location.lon}`);
  
  const images = await retrieveMapillaryImages(
    location.lat,
    location.lon,
    radiusMeters,
    maxImages
  );
  
  console.log(`[SfM] Retrieved ${images.length} reference images from Mapillary`);
  
  return images;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Use Mapillary downloader for Mapillary URLs, generic fetch otherwise
  if (url.includes('mapillary.com')) {
    return downloadMapillaryImage(url);
  }
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoWraith SfM Pipeline (research project)',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function calculateConfidence(
  matches: Map<string, ReturnType<typeof matchFeatures>>,
  reconstruction: SfMReconstruction,
  numReferences: number
): number {
  // Confidence factors:
  // 1. Number of verified matches
  // 2. Number of 3D points
  // 3. Number of reference images used
  // 4. Reconstruction completeness
  
  const totalMatches = Array.from(matches.values())
    .reduce((sum, m) => sum + m.length, 0);
  
  const matchScore = Math.min(totalMatches / 100, 1.0);
  const pointScore = Math.min(reconstruction.points3D.size / 500, 1.0);
  const referenceScore = Math.min(numReferences / 10, 1.0);
  const cameraScore = Math.min(reconstruction.images.size / 5, 1.0);
  
  // Weighted average
  return (
    matchScore * 0.3 +
    pointScore * 0.3 +
    referenceScore * 0.2 +
    cameraScore * 0.2
  );
}
