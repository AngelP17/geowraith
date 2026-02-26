/**
 * Source public domain images from multiple free sources.
 * Automatically downloads images and generates CSV metadata.
 * 
 * Sources:
 * - Wikimedia Commons (public domain)
 * - Unsplash Source (free photos)
 * - Pexels (free stock photos - requires API key)
 * - Pixabay (free stock photos - requires API key)
 * 
 * Usage:
 *   npx tsx src/scripts/sourcePublicDomainImages/index.ts --count=20 --source=wikimedia
 *   npx tsx src/scripts/sourcePublicDomainImages/index.ts --count=10 --source=unsplash
 * 
 * The script will:
 * 1. Download images from selected source
 * 2. Extract or assign GPS coordinates (for landmarks)
 * 3. Generate CSV file automatically
 * 4. Validate downloaded images
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import type { CliOptions } from './types.js';
import { PUBLIC_DOMAIN_IMAGES, TOTAL_IMAGE_COUNT } from './data.js';
import { sleep, processImage } from './downloader.js';
import { CSV_HEADER, writeCsvFile } from './csv.js';

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '20' },
    source: { type: 'string', default: 'wikimedia' },
    output: { type: 'string', default: '.cache/sourced_gallery' },
    cooldown: { type: 'string', default: '2000' },
  },
});

const cliValues = values as CliOptions;

const OUTPUT_DIR = path.resolve(process.cwd(), cliValues.output);
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const CSV_FILE = path.join(OUTPUT_DIR, 'metadata.csv');

async function main() {
  const targetCount = parseInt(cliValues.count, 10);
  const cooldownMs = parseInt(cliValues.cooldown, 10);
  
  console.log('[ImageSourcer] Sourcing public domain images');
  console.log(`  Target: ${targetCount} images`);
  console.log(`  Cooldown: ${cooldownMs}ms between requests`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('');
  
  await mkdir(IMAGES_DIR, { recursive: true });
  
  // Shuffle and select images
  const shuffled = [...PUBLIC_DOMAIN_IMAGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
  
  console.log(`[ImageSourcer] Selected ${selected.length} images from curated list`);
  console.log(`  (Total available: ${TOTAL_IMAGE_COUNT})`);
  console.log('');
  
  const csvLines: string[] = [CSV_HEADER];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < selected.length; i++) {
    const img = selected[i]!;
    const imagePath = path.join(IMAGES_DIR, img.filename);
    
    const result = await processImage({
      image: img,
      imagePath,
      cooldownMs,
      index: i,
      total: selected.length,
    });
    
    if (result.csvLine) {
      csvLines.push(result.csvLine);
    }
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Cooldown between requests
    if (i < selected.length - 1) {
      await sleep(cooldownMs);
    }
  }
  
  // Write CSV
  await writeCsvFile(CSV_FILE, csvLines.slice(1)); // Skip header for write
  
  console.log('');
  console.log('========================================');
  console.log('[ImageSourcer] Complete!');
  console.log('========================================');
  console.log(`Success: ${successCount}/${selected.length}`);
  console.log(`Failed: ${failCount}`);
  console.log(`CSV: ${CSV_FILE}`);
  console.log(`Images: ${IMAGES_DIR}`);
  console.log('');
  console.log('Next step: Build gallery and run validation');
  console.log(`  npm run build:gallery:csv -- --images=${IMAGES_DIR} --csv=${CSV_FILE}`);
  console.log('  npm run benchmark:validation');
  
  if (failCount > 0) {
    console.log('');
    console.log('⚠️ Some downloads failed. Run again to retry failed images.');
  }
}

main().catch((error) => {
  console.error('[ImageSourcer] Fatal error:', error);
  process.exit(1);
});
