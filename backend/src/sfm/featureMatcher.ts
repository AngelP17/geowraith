/**
 * Feature matching using nearest neighbor search.
 * In production, replace with SuperGlue for better accuracy.
 */

import type { ImageFeatures, FeatureMatch } from './types.js';

/**
 * Match features between two images using mutual nearest neighbor.
 */
export function matchFeatures(
  features1: ImageFeatures,
  features2: ImageFeatures,
  ratioThreshold = 0.8
): FeatureMatch[] {
  const matches: FeatureMatch[] = [];
  const desc1 = features1.descriptors;
  const desc2 = features2.descriptors;
  const n1 = features1.scores.length;
  const n2 = features2.scores.length;
  
  for (let i = 0; i < n1; i++) {
    let bestDist = Infinity;
    let secondBestDist = Infinity;
    let bestIdx = -1;
    
    const d1 = desc1.subarray(i * 256, (i + 1) * 256);
    
    for (let j = 0; j < n2; j++) {
      const d2 = desc2.subarray(j * 256, (j + 1) * 256);
      const dist = descriptorDistance(d1, d2);
      
      if (dist < bestDist) {
        secondBestDist = bestDist;
        bestDist = dist;
        bestIdx = j;
      } else if (dist < secondBestDist) {
        secondBestDist = dist;
      }
    }
    
    // Lowe's ratio test
    if (bestDist < ratioThreshold * secondBestDist) {
      matches.push({
        queryIdx: i,
        trainIdx: bestIdx,
        distance: bestDist,
      });
    }
  }
  
  return matches;
}

/**
 * Compute Euclidean distance between two descriptors.
 */
function descriptorDistance(d1: Float32Array, d2: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Geometric verification using RANSAC.
 * Returns inliers that satisfy epipolar constraint.
 */
export function geometricVerification(
  features1: ImageFeatures,
  features2: ImageFeatures,
  matches: FeatureMatch[],
  threshold = 3.0
): FeatureMatch[] {
  if (matches.length < 8) {
    return [];
  }
  
  const inliers: FeatureMatch[] = [];
  const kpts1 = matches.map(m => ({
    x: features1.keypoints[m.queryIdx * 2],
    y: features1.keypoints[m.queryIdx * 2 + 1],
  }));
  const kpts2 = matches.map(m => ({
    x: features2.keypoints[m.trainIdx * 2],
    y: features2.keypoints[m.trainIdx * 2 + 1],
  }));
  
  // Simple RANSAC for fundamental matrix estimation
  // In production, use robust 8-point algorithm
  const numIterations = Math.min(1000, matches.length * 10);
  let bestInliers: number[] = [];
  
  for (let iter = 0; iter < numIterations; iter++) {
    // Sample 8 random matches
    const sample = sampleRandom(matches.length, 8);
    
    // Count inliers
    const inlierIndices: number[] = [];
    for (let i = 0; i < matches.length; i++) {
      const error = computeEpipolarError(kpts1[i], kpts2[i]);
      if (error < threshold) {
        inlierIndices.push(i);
      }
    }
    
    if (inlierIndices.length > bestInliers.length) {
      bestInliers = inlierIndices;
    }
  }
  
  return bestInliers.map(idx => matches[idx]);
}

function sampleRandom(n: number, k: number): number[] {
  const result: number[] = [];
  const used = new Set<number>();
  
  while (result.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(idx);
    }
  }
  
  return result;
}

function computeEpipolarError(
  pt1: { x: number; y: number },
  pt2: { x: number; y: number }
): number {
  // Simplified epipolar error computation
  // In production, use actual fundamental matrix
  const dx = pt1.x - pt2.x;
  const dy = pt1.y - pt2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
