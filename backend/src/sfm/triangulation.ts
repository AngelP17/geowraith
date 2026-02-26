/**
 * Triangulation and camera pose utilities for SfM.
 */

import type { CameraPose, CameraParams, Point3D } from './types.js';
import { solve3x3, rotationToQuaternion } from './math.js';
export { rotationToQuaternion };

export function poseToProjectionMatrix(pose: CameraPose): number[][] {
  const R = pose.rotation;
  const t = pose.translation;
  
  return [
    [R[0], R[1], R[2], t[0]],
    [R[3], R[4], R[5], t[1]],
    [R[6], R[7], R[8], t[2]],
  ];
}

export function triangulate(
  pt1: { x: number; y: number },
  pt2: { x: number; y: number },
  pose1: CameraPose,
  pose2: CameraPose,
  camera: CameraParams
): [number, number, number] | null {
  const x1 = (pt1.x - camera.principalPoint[0]) / camera.focalLength;
  const y1 = (pt1.y - camera.principalPoint[1]) / camera.focalLength;
  
  const x2 = (pt2.x - camera.principalPoint[0]) / camera.focalLength;
  const y2 = (pt2.y - camera.principalPoint[1]) / camera.focalLength;
  
  const P1 = poseToProjectionMatrix(pose1);
  const P2 = poseToProjectionMatrix(pose2);
  
  const A = [
    [x1 * P1[2][0] - P1[0][0], x1 * P1[2][1] - P1[0][1], x1 * P1[2][2] - P1[0][2]],
    [y1 * P1[2][0] - P1[1][0], y1 * P1[2][1] - P1[1][1], y1 * P1[2][2] - P1[1][2]],
    [x2 * P2[2][0] - P2[0][0], x2 * P2[2][1] - P2[0][1], x2 * P2[2][2] - P2[0][2]],
    [y2 * P2[2][0] - P2[1][0], y2 * P2[2][1] - P2[1][1], y2 * P2[2][2] - P2[1][2]],
  ];
  
  const b = [
    P1[0][3] - x1 * P1[2][3],
    P1[1][3] - y1 * P1[2][3],
    P2[0][3] - x2 * P2[2][3],
    P2[1][3] - y2 * P2[2][3],
  ];
  
  // Solve using least squares via normal equations
  const At = transpose(A);
  const AtA = multiply(At, A);
  const Atb = multiplyVector(At, b);
  
  const X = solve3x3(AtA, Atb);
  
  if (X[2] <= 0) {
    return null;
  }
  
  return [X[0], X[1], X[2]];
}

function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const result: number[][] = [];
  
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j];
    }
  }
  
  return result;
}

function multiply(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [];
  
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < B[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < A[0].length; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

function multiplyVector(A: number[][], b: number[]): number[] {
  return A.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0));
}

export function estimateCameraParams(): CameraParams {
  return {
    focalLength: 800,
    principalPoint: [320, 240],
    distortion: [0, 0, 0, 0],
  };
}

export function getCameraPosition(pose: CameraPose): [number, number, number] {
  const R = pose.rotation;
  const t = pose.translation;
  
  return [
    -(R[0] * t[0] + R[3] * t[1] + R[6] * t[2]),
    -(R[1] * t[0] + R[4] * t[1] + R[7] * t[2]),
    -(R[2] * t[0] + R[5] * t[1] + R[8] * t[2]),
  ];
}

export function initializeFirstCamera(): CameraPose {
  return {
    rotation: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    translation: new Float32Array([0, 0, 0]),
    quaternion: [1, 0, 0, 0],
  };
}

export function estimateSecondCameraPose(
  features1: { keypoints: Float32Array },
  features2: { keypoints: Float32Array },
  matches: Array<{ queryIdx: number; trainIdx: number }>,
  camera: CameraParams
): CameraPose {
  const pts1 = matches.map(m => ({
    x: (features1.keypoints[m.queryIdx * 2] - camera.principalPoint[0]) / camera.focalLength,
    y: (features1.keypoints[m.queryIdx * 2 + 1] - camera.principalPoint[1]) / camera.focalLength,
  }));
  
  const pts2 = matches.map(m => ({
    x: (features2.keypoints[m.trainIdx * 2] - camera.principalPoint[0]) / camera.focalLength,
    y: (features2.keypoints[m.trainIdx * 2 + 1] - camera.principalPoint[1]) / camera.focalLength,
  }));
  
  const centroid1 = pts1.reduce((sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }), { x: 0, y: 0 });
  centroid1.x /= pts1.length;
  centroid1.y /= pts1.length;
  
  const centroid2 = pts2.reduce((sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }), { x: 0, y: 0 });
  centroid2.x /= pts2.length;
  centroid2.y /= pts2.length;
  
  const dx = centroid2.x - centroid1.x;
  const dy = centroid2.y - centroid1.y;
  const baselineLength = Math.sqrt(dx * dx + dy * dy) || 1.0;
  
  const tx = dx / baselineLength;
  const ty = dy / baselineLength;
  
  const angle = Math.atan2(dy, dx) * 0.1;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const rotation = new Float32Array([
    cos, -sin, 0,
    sin, cos, 0,
    0, 0, 1,
  ]);
  
  return {
    rotation,
    translation: new Float32Array([tx, ty, 0]),
    quaternion: rotationToQuaternion(rotation),
  };
}
