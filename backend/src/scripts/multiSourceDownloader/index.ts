/**
 * Multi-Source Public Domain Image Downloader
 * 
 * Downloads landmark images from multiple free sources:
 * - Wikimedia Commons (public domain)
 * - Picsum Photos (placeholder, for testing)
 * - Direct public domain archives
 * - Geograph Britain (CC-BY-SA)
 * - Smithsonian Open Access
 * 
 * Usage:
 *   npx tsx src/scripts/multiSourceDownloader/index.ts --count=30
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { PUBLIC_DOMAIN_IMAGES } from './data.js';
import { processImage } from './downloader.js';
import type { DownloadResult } from './types.js';

const { values } = parseArgs({
  options: {
    'count': { type: 'string', default: '30' },
    'output': { type: 'string', default: '.cache/smartblend_gallery' },
    'delay': { type: 'string', default: '1000' }, // ms between requests
  },
});

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function printConfig(count: number, outputDir: string, delayMs: number): void {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Multi-Source Public Domain Image Downloader           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Configuration:`);
  console.log(`  Target images: ${count}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Delay: ${delayMs}ms between requests\n`);
}

function printSummary(
  successCount: number,
  skippedCount: number,
  failCount: number,
  totalSelected: number,
  csvFile: string,
  imagesDir: string
): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    DOWNLOAD SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ Downloaded: ${successCount}`);
  console.log(`• Skipped (existing): ${skippedCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`\nTotal available: ${successCount + skippedCount}/${totalSelected}`);
  console.log(`\nCSV: ${csvFile}`);
  console.log(`Images: ${imagesDir}\n`);
}

function printNextSteps(): void {
  console.log('✅ Sufficient images acquired. Ready for validation.\n');
  console.log('Next steps:');
  console.log('  npm run build:gallery:csv --');
  console.log('    --images=.cache/smartblend_gallery/images');
  console.log('    --csv=.cache/smartblend_gallery/metadata.csv');
  console.log('  npm run benchmark:validation');
  console.log('');
}

export async function main(): Promise<void> {
  const count = parseInt(values.count!, 10);
  const outputDir = path.resolve(process.cwd(), values.output!);
  const imagesDir = path.join(outputDir, 'images');
  const csvFile = path.join(outputDir, 'metadata.csv');
  const delayMs = parseInt(values.delay!, 10);
  
  printConfig(count, outputDir, delayMs);
  
  await mkdir(imagesDir, { recursive: true });
  
  // Shuffle and select
  const shuffled = shuffleArray(PUBLIC_DOMAIN_IMAGES);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  console.log(`Selected ${selected.length} landmarks for download\n`);
  
  const csvLines: string[] = ['filename,lat,lon,label,accuracy_radius,source_method'];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < selected.length; i++) {
    const source = selected[i]!;
    const imagePath = path.join(imagesDir, source.filename);
    
    console.log(`[${i + 1}/${selected.length}] ${source.label}`);
    
    const result = await processImage(source, imagePath, delayMs, i === selected.length - 1);
    
    if (result.skipped) {
      console.log('  ✓ Already exists, skipping');
      skippedCount++;
      csvLines.push(`${source.filename},${source.lat},${source.lon},"${source.label}",30,existing`);
    } else if (result.success) {
      console.log('  ✓ Downloaded successfully');
      successCount++;
      csvLines.push(`${source.filename},${source.lat},${source.lon},"${source.label}",30,download`);
    } else {
      console.log('  ✗ All sources failed');
      failCount++;
    }
  }
  
  // Write CSV
  await writeFile(csvFile, csvLines.join('\n'));
  
  // Summary
  printSummary(successCount, skippedCount, failCount, selected.length, csvFile, imagesDir);
  
  if (successCount + skippedCount >= count * 0.5) {
    printNextSteps();
    process.exit(0);
  } else {
    console.log('⚠️ Too few images acquired. You may need to try again later.\n');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[Downloader] Fatal error:', error);
    process.exit(1);
  });
}
