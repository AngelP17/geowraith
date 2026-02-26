/**
 * Sparse 3D reconstruction from feature matches.
 */

import type {
  ImageFeatures,
  FeatureMatch,
  SfMReconstruction,
  CameraPose,
} from './types.js';
import {
  initializeFirstCamera,
  estimateSecondCameraPose,
  estimateCameraParams,
  getCameraPosition,
  triangulate,
} from './triangulation.js';
import {
  localizeNewImage,
  buildImagePairs,
  triangulatePoints,
} from './localization.js';

interface ImagePair {
  id1: string;
  id2: string;
  matches: FeatureMatch[];
}

export function buildReconstruction(
  imageIds: string[],
  features: Map<string, ImageFeatures>,
  matches: Map<string, FeatureMatch[]>
): SfMReconstruction {
  const reconstruction: SfMReconstruction = {
    images: new Map(),
    points3D: new Map(),
    cameraParams: estimateCameraParams(),
  };
  
  const pairs = buildImagePairs(imageIds, matches);
  if (pairs.length === 0) {
    return reconstruction;
  }
  
  const initialPair = pairs[0];
  
  const pose1 = initializeFirstCamera();
  const pose2 = estimateSecondCameraPose(
    features.get(initialPair.id1)!,
    features.get(initialPair.id2)!,
    initialPair.matches,
    reconstruction.cameraParams
  );
  
  reconstruction.images.set(initialPair.id1, pose1);
  reconstruction.images.set(initialPair.id2, pose2);
  
  triangulatePoints(
    reconstruction,
    initialPair.id1,
    initialPair.id2,
    features.get(initialPair.id1)!,
    features.get(initialPair.id2)!,
    initialPair.matches,
    triangulate
  );
  
  for (const imageId of imageIds) {
    if (reconstruction.images.has(imageId)) {
      continue;
    }
    
    const pose = localizeNewImage(
      imageId,
      features.get(imageId)!,
      reconstruction
    );
    
    if (pose) {
      reconstruction.images.set(imageId, pose);
      
      for (const existingId of reconstruction.images.keys()) {
        if (existingId === imageId) continue;
        
        const matchKey = `${imageId}-${existingId}`;
        const reverseKey = `${existingId}-${imageId}`;
        const match = matches.get(matchKey) || matches.get(reverseKey);
        
        if (match && match.length > 0) {
          triangulatePoints(
            reconstruction,
            imageId,
            existingId,
            features.get(imageId)!,
            features.get(existingId)!,
            match,
            triangulate
          );
        }
      }
    }
  }
  
  return reconstruction;
}

export { getCameraPosition };
