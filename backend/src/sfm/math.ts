/**
 * Linear algebra utilities for SfM.
 */

export function transpose(A: number[][]): number[][] {
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

export function multiply(A: number[][], B: number[][]): number[][] {
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

export function multiplyVector(A: number[][], b: number[]): number[] {
  return A.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0));
}

export function solve3x3(A: number[][], b: number[]): number[] {
  const det = determinant3x3(A);
  if (Math.abs(det) < 1e-10) {
    return [0, 0, 0];
  }
  
  const Ax = replaceColumn(A, 0, b);
  const Ay = replaceColumn(A, 1, b);
  const Az = replaceColumn(A, 2, b);
  
  return [
    determinant3x3(Ax) / det,
    determinant3x3(Ay) / det,
    determinant3x3(Az) / det,
  ];
}

function determinant3x3(A: number[][]): number {
  return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1])
       - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
       + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
}

function replaceColumn(A: number[][], col: number, b: number[]): number[][] {
  const result = A.map(row => [...row]);
  for (let i = 0; i < 3; i++) {
    result[i][col] = b[i];
  }
  return result;
}

export function rotationToQuaternion(R: Float32Array): [number, number, number, number] {
  const trace = R[0] + R[4] + R[8];
  let w, x, y, z;
  
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    w = 0.25 / s;
    x = (R[5] - R[7]) * s;
    y = (R[6] - R[2]) * s;
    z = (R[1] - R[3]) * s;
  } else {
    if (R[0] > R[4] && R[0] > R[8]) {
      const s = 2.0 * Math.sqrt(1.0 + R[0] - R[4] - R[8]);
      w = (R[5] - R[7]) / s;
      x = 0.25 * s;
      y = (R[3] + R[1]) / s;
      z = (R[6] + R[2]) / s;
    } else if (R[4] > R[8]) {
      const s = 2.0 * Math.sqrt(1.0 + R[4] - R[0] - R[8]);
      w = (R[6] - R[2]) / s;
      x = (R[3] + R[1]) / s;
      y = 0.25 * s;
      z = (R[7] + R[5]) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + R[8] - R[0] - R[4]);
      w = (R[1] - R[3]) / s;
      x = (R[6] + R[2]) / s;
      y = (R[7] + R[5]) / s;
      z = 0.25 * s;
    }
  }
  
  const norm = Math.sqrt(w * w + x * x + y * y + z * z);
  return [w / norm, x / norm, y / norm, z / norm];
}
