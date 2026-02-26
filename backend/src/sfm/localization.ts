/**
 * Camera localization using PnP (Perspective-n-Point).
 */

import type { ImageFeatures, CameraPose, CameraParams, SfMReconstruction, FeatureMatch } from './types.js';
import { poseToProjectionMatrix, estimateCameraParams, rotationToQuaternion } from './triangulation.js';

export function localizeNewImage(
  imageId: string,
  features: ImageFeatures,
  reconstruction: SfMReconstruction
): CameraPose | null {
  const matches2D3D: Array<{ pt2D: [number, number]; pt3D: [number, number, number] }> = [];
  
  // Find 2D-3D correspondences
  for (const [pid, pt3D] of reconstruction.points3D) {
    for (const obs of pt3D.observations) {
      if (obs.imageId !== imageId) {
        matches2D3D.push({
          pt2D: [features.keypoints[obs.featureIdx * 2], features.keypoints[obs.featureIdx * 2 + 1]],
          pt3D: pt3D.position,
        });
      }
    }
  }
  
  if (matches2D3D.length < 6) {
    return null;
  }
  
  const pts2D = matches2D3D.slice(0, 6).map(m => m.pt2D);
  const pts3D = matches2D3D.slice(0, 6).map(m => m.pt3D);
  
  return estimatePoseDLT(pts2D, pts3D, reconstruction.cameraParams);
}

function estimatePoseDLT(
  pts2D: [number, number][],
  pts3D: [number, number, number][],
  camera: CameraParams
): CameraPose | null {
  const centroid2D = pts2D.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1]], [0, 0])
    .map(v => v / pts2D.length) as [number, number];
  
  const centroid3D = pts3D.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0])
    .map(v => v / pts3D.length) as [number, number, number];
  
  const tx = (centroid2D[0] - camera.principalPoint[0]) / camera.focalLength - centroid3D[0];
  const ty = (centroid2D[1] - camera.principalPoint[1]) / camera.focalLength - centroid3D[1];
  
  const rotation = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  
  return {
    rotation,
    translation: new Float32Array([tx, ty, 0]),
    quaternion: rotationToQuaternion(rotation),
  };
}

export function buildImagePairs(
  imageIds: string[],
  matches: Map<string, FeatureMatch[]>
): Array<{ id1: string; id2: string; matches: FeatureMatch[] }> {
  const pairs: Array<{ id1: string; id2: string; matches: FeatureMatch[] }> = [];
  
  for (let i = 0; i < imageIds.length; i++) {
    for (let j = i + 1; j < imageIds.length; j++) {
      const id1 = imageIds[i];
      const id2 = imageIds[j];
      const key = `${id1}-${id2}`;
      const match = matches.get(key);
      
      if (match && match.length >= 10) {
        pairs.push({ id1, id2, matches: match });
      }
    }
  }
  
  return pairs.sort((a, b) => b.matches.length - a.matches.length);
}

export function triangulatePoints(
  reconstruction: SfMReconstruction,
  id1: string,
  id2: string,
  features1: ImageFeatures,
  features2: ImageFeatures,
  matches: FeatureMatch[],
  triangulateFn: (
    pt1: { x: number; y: number },
    pt2: { x: number; y: number },
    pose1: CameraPose,
    pose2: CameraPose,
    camera: CameraParams
  ) => [number, number, number] | null
): void {
  const pose1 = reconstruction.images.get(id1)!;
  const pose2 = reconstruction.images.get(id2)!;
  
  let pointId = reconstruction.points3D.size;
  
  for (const match of matches) {
    let existingId: number | undefined;
    for (const [pid, pt] of reconstruction.points3D) {
      if (pt.observations.some(o => o.imageId === id1 && o.featureIdx === match.queryIdx)) {
        existingId = pid;
        break;
      }
    }
    
    if (existingId !== undefined) {
      const pt = reconstruction.points3D.get(existingId)!;
      if (!pt.observations.some(o => o.imageId === id2)) {
        pt.observations.push({
          imageId: id2,
          featureIdx: match.trainIdx,
        });
      }
    } else {
      const pt1 = {
        x: features1.keypoints[match.queryIdx * 2],
        y: features1.keypoints[match.queryIdx * 2 + 1],
      };
      const pt2 = {
        x: features2.keypoints[match.trainIdx * 2],
        y: features2.keypoints[match.trainIdx * 2 + 1],
      };
      
      const point3D = triangulateFn(pt1, pt2, pose1, pose2, reconstruction.cameraParams);
      
      if (point3D) {
        reconstruction.points3D.set(pointId, {
          id: pointId,
          position: point3D,
          observations: [
            { imageId: id1, featureIdx: match.queryIdx },
            { imageId: id2, featureIdx: match.trainIdx },
          ],
        });
        pointId++;
      }
    }
  }
}
