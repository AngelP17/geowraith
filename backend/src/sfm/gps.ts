/**
 * GPS coordinate conversion utilities.
 */

import type { CameraPose } from './types.js';

// Earth's radius in meters
const EARTH_RADIUS = 6_371_000;

/**
 * Convert camera pose to GPS coordinates.
 * Requires at least 2 reference images with known GPS to solve scale.
 */
export function poseToGPS(
  queryPose: CameraPose,
  referencePoses: Array<{ pose: CameraPose; gps: { lat: number; lon: number } }>
): { lat: number; lon: number; accuracy_m: number } {
  if (referencePoses.length < 2) {
    throw new Error('Need at least 2 reference images with GPS');
  }
  
  // Estimate scale from reference images
  const scale = estimateScale(queryPose, referencePoses);
  
  // Get camera position
  const position = getCameraPosition(queryPose);
  
  // Compute relative position to nearest reference
  const nearestRef = findNearestReference(queryPose, referencePoses);
  const refPosition = getCameraPosition(nearestRef.pose);
  
  // Compute offset in meters
  const dx = (position[0] - refPosition[0]) * scale;
  const dy = (position[1] - refPosition[1]) * scale;
  const dz = (position[2] - refPosition[2]) * scale;
  
  // Convert to GPS offset
  const dLat = (dy / EARTH_RADIUS) * (180 / Math.PI);
  const dLon = (dx / (EARTH_RADIUS * Math.cos(nearestRef.gps.lat * Math.PI / 180))) * (180 / Math.PI);
  
  return {
    lat: nearestRef.gps.lat + dLat,
    lon: nearestRef.gps.lon + dLon,
    accuracy_m: estimateAccuracy(referencePoses.length, scale),
  };
}

function estimateScale(
  queryPose: CameraPose,
  referencePoses: Array<{ pose: CameraPose; gps: { lat: number; lon: number } }>
): number {
  // Estimate scale from known GPS distances
  let totalScale = 0;
  let count = 0;
  
  for (let i = 0; i < referencePoses.length; i++) {
    for (let j = i + 1; j < referencePoses.length; j++) {
      const ref1 = referencePoses[i];
      const ref2 = referencePoses[j];
      
      // GPS distance
      const gpsDist = haversineDistance(
        ref1.gps.lat, ref1.gps.lon,
        ref2.gps.lat, ref2.gps.lon
      );
      
      // Reconstruction distance (up to scale)
      const pos1 = getCameraPosition(ref1.pose);
      const pos2 = getCameraPosition(ref2.pose);
      const reconDist = Math.sqrt(
        Math.pow(pos1[0] - pos2[0], 2) +
        Math.pow(pos1[1] - pos2[1], 2) +
        Math.pow(pos1[2] - pos2[2], 2)
      );
      
      if (reconDist > 0.001) {
        totalScale += gpsDist / reconDist;
        count++;
      }
    }
  }
  
  return count > 0 ? totalScale / count : 1.0;
}

function findNearestReference(
  queryPose: CameraPose,
  referencePoses: Array<{ pose: CameraPose; gps: { lat: number; lon: number } }>
): { pose: CameraPose; gps: { lat: number; lon: number } } {
  let nearest = referencePoses[0];
  let minDist = Infinity;
  
  const queryPos = getCameraPosition(queryPose);
  
  for (const ref of referencePoses) {
    const refPos = getCameraPosition(ref.pose);
    const dist = Math.sqrt(
      Math.pow(queryPos[0] - refPos[0], 2) +
      Math.pow(queryPos[1] - refPos[1], 2) +
      Math.pow(queryPos[2] - refPos[2], 2)
    );
    
    if (dist < minDist) {
      minDist = dist;
      nearest = ref;
    }
  }
  
  return nearest;
}

function estimateAccuracy(numReferences: number, scale: number): number {
  // Accuracy depends on number of references and reconstruction quality
  // Typical SfM accuracy: 0.1% - 1% of scene size
  const baseAccuracy = 10.0; // meters
  const referenceBonus = Math.min(numReferences * 2, 20); // More references = better accuracy
  const scaleFactor = Math.min(scale / 100, 5); // Smaller scenes = better accuracy
  
  return Math.max(baseAccuracy - referenceBonus + scaleFactor, 1.0);
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
}

function getCameraPosition(pose: CameraPose): [number, number, number] {
  const R = pose.rotation;
  const t = pose.translation;
  
  return [
    -(R[0] * t[0] + R[3] * t[1] + R[6] * t[2]),
    -(R[1] * t[0] + R[4] * t[1] + R[7] * t[2]),
    -(R[2] * t[0] + R[5] * t[1] + R[8] * t[2]),
  ];
}
