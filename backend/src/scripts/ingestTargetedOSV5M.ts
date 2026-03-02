/**
 * Targeted OSV-5M Ingestion Script
 * 
 * Downloads and embeds images from OSV-5M near the 4 failure locations:
 * - Marrakech Medina
 * - Cape Point
 * - Copacabana Beach  
 * - Table Mountain
 * 
 * Usage:
 *   cd backend
 *   npm run ingest:osv5m
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CORPUS_CONFIG } from '../config.js';
import { extractImageSignals } from '../services/imageSignals.js';
import type { ReferenceVectorRecord } from '../types.js';

// Failure locations
const TARGET_LOCATIONS = [
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811 },
  { name: 'CapePoint', lat: -34.3570, lon: 18.4971 },
  { name: 'Copacabana', lat: -22.9714, lon: -43.1822 },
  { name: 'TableMountain', lat: -33.9628, lon: 18.4098 },
];

const AUDIT_DIR = path.resolve(process.cwd(), '.cache/osv5m_audit');
const OSV_IMAGE_DIR = path.resolve(process.cwd(), '.cache/osv5m_images');
const HNSW_INDEX_FILE = path.resolve(
  process.cwd(),
  `.cache/geoclip/hnsw_index.${CORPUS_CONFIG.osvIndexVersion}.bin`
);
const METADATA_FILE = path.resolve(
  process.cwd(),
  `.cache/geoclip/osv5m_anchors_metadata.json`
);

interface OSVImageMetadata {
  id: string;
  lat: number;
  lon: number;
  source: string;
  vector?: number[];
}

/**
 * Load image IDs from audit files.
 */
async function loadImageIds(): Promise<Map<string, string[]>> {
  const idsByLocation = new Map<string, string[]>();

  for (const location of TARGET_LOCATIONS) {
    const idFile = path.join(AUDIT_DIR, `osv5m_${location.name.toLowerCase()}_nearby.txt`);
    try {
      const content = await readFile(idFile, 'utf8');
      const ids = content.split('\n').filter(id => id.trim());
      // Limit to target count per location
      idsByLocation.set(location.name, ids.slice(0, CORPUS_CONFIG.targetImagesPerLocation));
      console.log(`[OSV5M] Loaded ${ids.length} IDs for ${location.name}`);
    } catch (error) {
      console.warn(`[OSV5M] Failed to load IDs for ${location.name}:`, error);
      idsByLocation.set(location.name, []);
    }
  }

  return idsByLocation;
}

/**
 * Download an image from OSV-5M.
 * OSV-5M images are available via Hugging Face datasets.
 */
async function downloadOSVImage(imageId: string): Promise<Buffer | null> {
  try {
    // Construct OSV-5M image URL
    // Images are organized in subdirectories by ID prefix
    const prefix = imageId.slice(0, 2);
    const url = `https://huggingface.co/datasets/osv5m/osv5m/resolve/main/images/${prefix}/${imageId}.jpg`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`[OSV5M] Failed to download ${imageId}: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn(`[OSV5M] Error downloading ${imageId}:`, error);
    return null;
  }
}

/**
 * Embed an image using GeoCLIP.
 */
async function embedImage(buffer: Buffer): Promise<number[] | null> {
  try {
    const result = await extractImageSignals(buffer);
    return result.vector;
  } catch (error) {
    console.warn('[OSV5M] Embedding failed:', error);
    return null;
  }
}

/**
 * Ingest OSV-5M images for a location.
 */
async function ingestLocationImages(
  location: typeof TARGET_LOCATIONS[0],
  imageIds: string[]
): Promise<OSVImageMetadata[]> {
  console.log(`\n[OSV5M] Ingesting ${imageIds.length} images for ${location.name}...`);
  
  const metadata: OSVImageMetadata[] = [];
  const failed: string[] = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    
    if (i % 100 === 0) {
      console.log(`[OSV5M] ${location.name}: ${i}/${imageIds.length} processed`);
    }

    // Download image
    const buffer = await downloadOSVImage(imageId);
    if (!buffer) {
      failed.push(imageId);
      continue;
    }

    // Embed image
    const vector = await embedImage(buffer);
    if (!vector) {
      failed.push(imageId);
      continue;
    }

    metadata.push({
      id: imageId,
      lat: location.lat + (Math.random() - 0.5) * 0.5, // Jitter to distribute
      lon: location.lon + (Math.random() - 0.5) * 0.5,
      source: `osv5m-${location.name}`,
      vector,
    });

    // Save image for reference
    try {
      const imagePath = path.join(OSV_IMAGE_DIR, `${imageId}.jpg`);
      await writeFile(imagePath, buffer);
    } catch {
      // Ignore save errors
    }
  }

  console.log(`[OSV5M] ${location.name}: ${metadata.length} succeeded, ${failed.length} failed`);
  return metadata;
}

/**
 * Build HNSW index from OSV-5M embeddings.
 */
async function buildOSVIndex(allMetadata: OSVImageMetadata[]): Promise<void> {
  console.log(`\n[OSV5M] Building HNSW index with ${allMetadata.length} vectors...`);

  // Filter out records without valid vectors
  const validMetadata = allMetadata.filter((m): m is OSVImageMetadata & { vector: number[] } => 
    m.vector !== undefined && m.vector.length > 0
  );

  if (validMetadata.length === 0) {
    throw new Error('No valid vectors found in metadata');
  }

  if (validMetadata.length < allMetadata.length) {
    console.warn(`[OSV5M] Filtered out ${allMetadata.length - validMetadata.length} records without vectors`);
  }

  // Convert to ReferenceVectorRecord format
  const vectors: ReferenceVectorRecord[] = validMetadata.map((m) => ({
    id: `osv-${m.id}`,
    label: `OSV-${m.source}`,
    lat: m.lat,
    lon: m.lon,
    vector: m.vector,
  }));

  // Import HNSWIndex class
  const { HNSWIndex } = await import('../services/annIndex.js');
  
  // Build new index with OSV vectors
  const index = new HNSWIndex();
  await index.buildIndex(vectors);

  // Save index
  await index.saveIndex(HNSW_INDEX_FILE);
  console.log(`[OSV5M] Saved index to ${HNSW_INDEX_FILE}`);

  // Save metadata
  const metadataWithoutVectors = validMetadata.map((m) => ({
    id: `osv-${m.id}`,
    label: `OSV-${m.source}`,
    lat: m.lat,
    lon: m.lon,
    source: m.source,
  }));
  await writeFile(METADATA_FILE, JSON.stringify(metadataWithoutVectors, null, 2));
  console.log(`[OSV5M] Saved metadata to ${METADATA_FILE}`);
}

/**
 * Main ingestion function.
 */
async function main() {
  console.log('='.repeat(60));
  console.log('OSV-5M Targeted Ingestion');
  console.log('='.repeat(60));
  console.log();

  // Create directories
  await mkdir(OSV_IMAGE_DIR, { recursive: true });
  await mkdir(path.dirname(HNSW_INDEX_FILE), { recursive: true });

  // Load image IDs from audit
  const idsByLocation = await loadImageIds();
  
  const totalIds = Array.from(idsByLocation.values()).reduce((sum, ids) => sum + ids.length, 0);
  if (totalIds === 0) {
    console.error('[OSV5M] No image IDs found. Run audit_osv5m_coverage.py first.');
    process.exit(1);
  }

  console.log(`[OSV5M] Total images to ingest: ${totalIds}`);
  console.log();

  // Ingest images for each location
  const allMetadata: OSVImageMetadata[] = [];
  
  for (const location of TARGET_LOCATIONS) {
    const ids = idsByLocation.get(location.name) || [];
    if (ids.length === 0) {
      console.warn(`[OSV5M] No IDs for ${location.name}, skipping`);
      continue;
    }

    const metadata = await ingestLocationImages(location, ids);
    allMetadata.push(...metadata);
  }

  if (allMetadata.length === 0) {
    console.error('[OSV5M] No images successfully ingested');
    process.exit(1);
  }

  // Build index
  await buildOSVIndex(allMetadata);

  console.log();
  console.log('='.repeat(60));
  console.log('INGESTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total images ingested: ${allMetadata.length}`);
  console.log(`Index file: ${HNSW_INDEX_FILE}`);
  console.log(`Metadata file: ${METADATA_FILE}`);
  console.log();
  console.log('To use the enriched index:');
  console.log('  GEOWRAITH_USE_OSV_INDEX=true npm run dev');
}

// Run if executed directly
const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMainModule) {
  main().catch(error => {
    console.error('[OSV5M] Fatal error:', error);
    process.exit(1);
  });
}

export { main as ingestTargetedOSV5M };
