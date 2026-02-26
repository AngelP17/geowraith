/**
 * DBSCAN clustering for geographic coordinate clustering.
 *
 * Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
 * - Automatically discovers cluster count
 * - Handles arbitrary cluster shapes
 * - Identifies outliers (noise points)
 */

import { haversineMeters } from '../utils/geo.js';
import type { VectorMatch } from '../types.js';

export interface Cluster {
  id: number;
  points: VectorMatch[];
  centroid: { lat: number; lon: number };
  density: number;
  isNoise: boolean;
}

export interface DBSCANConfig {
  epsilon: number;
  minPoints: number;
  maxClusters: number;
}

const DEFAULT_CONFIG: DBSCANConfig = {
  epsilon: 50000,
  minPoints: 3,
  maxClusters: 10,
};

export class DBSCANClusterer {
  private config: DBSCANConfig;

  constructor(config: Partial<DBSCANConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<DBSCANConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private getNeighbors(
    point: VectorMatch,
    allPoints: VectorMatch[],
    visited: Set<string>
  ): VectorMatch[] {
    const neighbors: VectorMatch[] = [];

    for (const other of allPoints) {
      if (visited.has(other.id)) continue;

      const distance = haversineMeters(
        { lat: point.lat, lon: point.lon },
        { lat: other.lat, lon: other.lon }
      );

      if (distance <= this.config.epsilon) {
        neighbors.push(other);
      }
    }

    return neighbors;
  }

  private expandCluster(
    point: VectorMatch,
    neighbors: VectorMatch[],
    allPoints: VectorMatch[],
    cluster: VectorMatch[],
    visited: Set<string>,
    clustered: Set<string>
  ): void {
    cluster.push(point);
    clustered.add(point.id);

    let neighborIndex = 0;
    while (neighborIndex < neighbors.length) {
      const neighbor = neighbors[neighborIndex];
      neighborIndex += 1;

      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);

        const secondNeighbors = this.getNeighbors(neighbor, allPoints, visited);
        if (secondNeighbors.length >= this.config.minPoints) {
          neighbors.push(...secondNeighbors);
        }
      }

      if (!clustered.has(neighbor.id)) {
        cluster.push(neighbor);
        clustered.add(neighbor.id);
      }
    }
  }

  cluster(matches: VectorMatch[]): Cluster[] {
    if (matches.length === 0) {
      return [];
    }

    const visited = new Set<string>();
    const clustered = new Set<string>();
    const clusters: Cluster[] = [];
    let clusterId = 0;

    for (const point of matches) {
      if (visited.has(point.id)) {
        continue;
      }

      visited.add(point.id);

      const neighbors = this.getNeighbors(point, matches, visited);

      if (neighbors.length < this.config.minPoints) {
        clusters.push({
          id: -1,
          points: [point],
          centroid: { lat: point.lat, lon: point.lon },
          density: 0,
          isNoise: true,
        });
      } else {
        const cluster: VectorMatch[] = [];
        this.expandCluster(point, neighbors, matches, cluster, visited, clustered);

        const centroid = this.computeCentroid(cluster);
        const density = this.computeDensity(cluster);

        clusters.push({
          id: clusterId,
          points: cluster,
          centroid,
          density,
          isNoise: false,
        });

        clusterId += 1;

        if (clusterId >= this.config.maxClusters) {
          break;
        }
      }
    }

    return clusters.filter(c => c.points.length > 0).sort((a, b) => b.density - a.density);
  }

  private computeCentroid(points: VectorMatch[]): { lat: number; lon: number } {
    if (points.length === 0) {
      return { lat: 0, lon: 0 };
    }

    let latSum = 0;
    let lonSum = 0;

    for (const point of points) {
      latSum += point.lat;
      lonSum += point.lon;
    }

    return {
      lat: latSum / points.length,
      lon: lonSum / points.length,
    };
  }

  private computeDensity(points: VectorMatch[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    let count = 0;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        totalDistance += haversineMeters(
          { lat: points[i].lat, lon: points[i].lon },
          { lat: points[j].lat, lon: points[j].lon }
        );
        count += 1;
      }
    }

    const avgDistance = count > 0 ? totalDistance / count : this.config.epsilon;
    const normalizedDensity = 1 - Math.min(avgDistance / this.config.epsilon, 1);

    return normalizedDensity * Math.sqrt(points.length);
  }

  getBestCluster(clusters: Cluster[]): Cluster | null {
    const validClusters = clusters.filter(c => !c.isNoise && c.points.length > 0);

    if (validClusters.length === 0) {
      return clusters[0] || null;
    }

    return validClusters.reduce((best, current) => {
      if (current.density > best.density) return current;
      if (current.density < best.density) return best;

      if (current.points.length > best.points.length) return current;
      return best;
    });
  }

  getTopClusters(clusters: Cluster[], count: number): Cluster[] {
    return clusters
      .filter(c => !c.isNoise)
      .slice(0, count);
  }
}

export function createDBSCANClusterer(config?: Partial<DBSCANConfig>): DBSCANClusterer {
  return new DBSCANClusterer(config);
}
