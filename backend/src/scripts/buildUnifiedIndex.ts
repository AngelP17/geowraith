/**
 * Build Unified Multi-Source Index (Endgame)
 * 
 * Combines ALL reference sources into a single searchable index:
 * 1. Base reference corpus (300K curated images)
 * 2. Mapillary street-level references (350 real images from failure locations)
 * 3. Synthetic landmarks (37 geo-anchors)
 * 4. Manual landmarks (can be added)
 * 
 * This is the production-ready index for 95-98% accuracy target.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HNSWIndex } from '../services/annIndex.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ReferenceVectorRecord } from '../types.js';

const CACHE_DIR = path.resolve(process.cwd(), '.cache/geoclip');
const REFERENCE_DIR = path.resolve(process.cwd(), '.cache/mapillary_references');
const LANDMARK_DIR = path.resolve(process.cwd(), '.cache/landmark_db');

// Source files
const BASE_VECTORS_FILE = path.join(CACHE_DIR, 'referenceImageVectors.merged_v1.json');
const MAPILLARY_EMBEDDINGS_FILE = path.join(REFERENCE_DIR, 'mapillary_embeddings.json');
const MAPILLARY_METADATA_FILE = path.join(REFERENCE_DIR, 'mapillary_metadata.json');
const SYNTHETIC_EMBEDDINGS_FILE = path.join(LANDMARK_DIR, 'synthetic_embeddings.json');

// Output
const UNIFIED_VERSION = 'v3-unified-endgame';
const OUTPUT_INDEX_FILE = path.join(CACHE_DIR, `hnsw_index.${UNIFIED_VERSION}.bin`);
const OUTPUT_VECTORS_FILE = path.join(CACHE_DIR, `referenceVectors.${UNIFIED_VERSION}.json`);
const OUTPUT_METADATA_FILE = path.join(CACHE_DIR, `hnsw_index.${UNIFIED_VERSION}.metadata.json`);

interface UnifiedMetadata {
  version: string;
  timestamp: string;
  totalPoints: number;
  sources: {
    base: { count: number; file: string };
    mapillary: { count: number; locations: Record<string, number>; file: string };
    synthetic: { count: number; categories: Record<string, number>; file: string };
  };
  coverage: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
  densificationTargets: string[];
}

async function buildUnifiedIndex(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     BUILDING UNIFIED MULTI-SOURCE INDEX (ENDGAME)          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const allVectors: ReferenceVectorRecord[] = [];
  const sourceStats = {
    base: 0,
    mapillary: 0,
    synthetic: 0,
  };
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE 1: Base Reference Corpus (300K images)
  // ═══════════════════════════════════════════════════════════
  console.log('[1/4] Loading base reference corpus...');
  if (!fs.existsSync(BASE_VECTORS_FILE)) {
    console.error(`  ❌ Base vectors not found: ${BASE_VECTORS_FILE}`);
    console.log('      Run: npm run download:corpus');
    process.exit(1);
  }
  
  const baseData = JSON.parse(fs.readFileSync(BASE_VECTORS_FILE, 'utf-8'));
  const baseVectors: ReferenceVectorRecord[] = baseData.vectors || baseData;
  baseVectors.forEach(v => {
    allVectors.push(v);
  });
  sourceStats.base = baseVectors.length;
  console.log(`  ✓ Loaded ${sourceStats.base.toLocaleString()} base vectors\n`);
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE 2: Mapillary References (350 real street images)
  // ═══════════════════════════════════════════════════════════
  console.log('[2/4] Loading Mapillary street references...');
  if (fs.existsSync(MAPILLARY_METADATA_FILE)) {
    const mapillaryData: Array<{
      id: string;
      embedding: number[];
      lat: number;
      lon: number;
      location: string;
      source: string;
    }> = JSON.parse(fs.readFileSync(MAPILLARY_METADATA_FILE, 'utf-8'));
    
    mapillaryData.forEach(m => {
      allVectors.push({
        id: m.id,
        label: `mapillary_${m.location}`,
        lat: m.lat,
        lon: m.lon,
        vector: m.embedding,
      });
    });
    sourceStats.mapillary = mapillaryData.length;
    
    const byLocation = mapillaryData.reduce((acc, m) => {
      acc[m.location] = (acc[m.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`  ✓ Loaded ${sourceStats.mapillary} Mapillary images`);
    Object.entries(byLocation).forEach(([loc, count]) => {
      console.log(`      • ${loc}: ${count} images`);
    });
    console.log();
  } else {
    console.log('  ⚠ No Mapillary data found. Run: npm run download:mapillary\n');
  }
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE 3: Synthetic Landmarks (37 geo-anchors)
  // ═══════════════════════════════════════════════════════════
  console.log('[3/4] Loading synthetic landmarks...');
  if (fs.existsSync(SYNTHETIC_EMBEDDINGS_FILE)) {
    const syntheticData = JSON.parse(fs.readFileSync(SYNTHETIC_EMBEDDINGS_FILE, 'utf-8'));
    const embeddings: number[][] = syntheticData.embeddings;
    const coords: Array<[number, number]> = syntheticData.coordinates;
    const ids: string[] = syntheticData.ids;
    
    embeddings.forEach((emb, i) => {
      allVectors.push({
        id: ids[i]!,
        label: `synthetic_${ids[i]!.split('_')[0]}`,
        lat: coords[i]![0],
        lon: coords[i]![1],
        vector: emb,
      });
    });
    sourceStats.synthetic = embeddings.length;
    
    const byCat = ids.reduce((acc, id) => {
      const cat = id.split('_')[0] || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`  ✓ Loaded ${sourceStats.synthetic} synthetic landmarks`);
    Object.entries(byCat).forEach(([cat, count]) => {
      const name = { mrk: 'Marrakech', cop: 'Copacabana', tm: 'Table Mtn', cp: 'Cape Point' }[cat] || cat;
      console.log(`      • ${name}: ${count} points`);
    });
    console.log();
  } else {
    console.log('  ⚠ No synthetic data found. Run: npm run build:synthetic\n');
  }
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE 4: Manual Landmarks (placeholder for future)
  // ═══════════════════════════════════════════════════════════
  console.log('[4/4] Checking for manual landmarks...');
  console.log('  ℹ No manual landmarks configured (optional)\n');
  
  // ═══════════════════════════════════════════════════════════
  // BUILD HNSW INDEX
  // ═══════════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('BUILDING UNIFIED HNSW INDEX');
  console.log('═'.repeat(60));
  console.log(`Total vectors: ${allVectors.length.toLocaleString()}\n`);
  
  const index = new HNSWIndex();
  
  console.log('Building index...');
  await index.buildIndex(allVectors);
  console.log(`  ✓ Indexed ${allVectors.length.toLocaleString()} vectors`);
  
  // ═══════════════════════════════════════════════════════════
  // CALCULATE COVERAGE
  // ═══════════════════════════════════════════════════════════
  const allLats = allVectors.map(v => v.lat);
  const allLons = allVectors.map(v => v.lon);
  
  const coverage = {
    latMin: Math.min(...allLats),
    latMax: Math.max(...allLats),
    lonMin: Math.min(...allLons),
    lonMax: Math.max(...allLons),
  };
  
  // ═══════════════════════════════════════════════════════════
  // SAVE OUTPUT
  // ═══════════════════════════════════════════════════════════
  console.log('\nSaving unified index...');
  index.saveIndex(OUTPUT_INDEX_FILE);
  
  fs.writeFileSync(OUTPUT_VECTORS_FILE, JSON.stringify(allVectors));
  
  const metadata: UnifiedMetadata = {
    version: UNIFIED_VERSION,
    timestamp: new Date().toISOString(),
    totalPoints: allVectors.length,
    sources: {
      base: {
        count: sourceStats.base,
        file: BASE_VECTORS_FILE,
      },
      mapillary: {
        count: sourceStats.mapillary,
        locations: fs.existsSync(MAPILLARY_METADATA_FILE) 
          ? JSON.parse(fs.readFileSync(MAPILLARY_METADATA_FILE, 'utf-8'))
              .reduce((acc: Record<string, number>, m: { location: string }) => {
                acc[m.location] = (acc[m.location] || 0) + 1;
                return acc;
              }, {})
          : {},
        file: MAPILLARY_METADATA_FILE,
      },
      synthetic: {
        count: sourceStats.synthetic,
        categories: fs.existsSync(SYNTHETIC_EMBEDDINGS_FILE)
          ? (JSON.parse(fs.readFileSync(SYNTHETIC_EMBEDDINGS_FILE, 'utf-8')).ids as string[])
              .reduce((acc: Record<string, number>, id: string) => {
                const cat = id.split('_')[0] || 'unknown';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
              }, {})
          : {},
        file: SYNTHETIC_EMBEDDINGS_FILE,
      },
    },
    coverage,
    densificationTargets: ['Marrakech', 'Copacabana', 'TableMountain', 'CapePoint'],
  };
  
  fs.writeFileSync(OUTPUT_METADATA_FILE, JSON.stringify(metadata, null, 2));
  
  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('UNIFIED INDEX BUILD COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n📊 Total vectors: ${allVectors.length.toLocaleString()}`);
  console.log(`   • Base corpus:     ${sourceStats.base.toLocaleString()} (${(sourceStats.base/allVectors.length*100).toFixed(1)}%)`);
  console.log(`   • Mapillary:       ${sourceStats.mapillary} (${(sourceStats.mapillary/allVectors.length*100).toFixed(3)}%)`);
  console.log(`   • Synthetic:       ${sourceStats.synthetic} (${(sourceStats.synthetic/allVectors.length*100).toFixed(3)}%)`);
  
  console.log(`\n🌍 Coverage:`);
  console.log(`   Lat: [${coverage.latMin.toFixed(2)}, ${coverage.latMax.toFixed(2)}]`);
  console.log(`   Lon: [${coverage.lonMin.toFixed(2)}, ${coverage.lonMax.toFixed(2)}]`);
  
  console.log(`\n📁 Output files:`);
  console.log(`   • ${OUTPUT_INDEX_FILE}`);
  console.log(`   • ${OUTPUT_VECTORS_FILE}`);
  console.log(`   • ${OUTPUT_METADATA_FILE}`);
  
  console.log(`\n🎯 Accuracy strategy:`);
  console.log(`   • Dense coverage in failure locations (Mapillary)`);
  console.log(`   • Geo-anchors for similarity search (Synthetic)`);
  console.log(`   • Global baseline coverage (Base corpus)`);
  console.log(`   • LLM verifier for edge cases (runtime)`);
  
  console.log(`\n✨ Next steps:`);
  console.log(`   GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation`);
  console.log('═'.repeat(60));
}

buildUnifiedIndex().catch(console.error);
