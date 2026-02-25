/**
 * SmartBlend Expansion Loop
 * 
 * Keeps retrying SmartBlend with delays to build a 30-50 image validation set
 * despite Wikimedia rate limits.
 * 
 * Usage: npx tsx src/scripts/expandValidationSet.ts --target=30
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import path from 'node:path';

const { values } = parseArgs({
  options: {
    'target': { type: 'string', default: '30' },
    'max-attempts': { type: 'string', default: '10' },
    'delay-minutes': { type: 'string', default: '2' },
  },
});

const TARGET = parseInt(values.target!, 10);
const MAX_ATTEMPTS = parseInt(values['max-attempts']!, 10);
const DELAY_MS = parseInt(values['delay-minutes']!, 10) * 60 * 1000;

const IMAGES_DIR = path.resolve(process.cwd(), '.cache/smartblend_gallery/images');

function countImages(): number {
  if (!existsSync(IMAGES_DIR)) return 0;
  return readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).length;
}

function runSmartBlend(batchSize: number): void {
  const cmd = `npm run smartblend -- --min-images=${batchSize} --max-retries=3 --strategy=auto`;
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { 
      stdio: 'inherit', 
      timeout: 300000, // 5 min timeout per batch
      cwd: process.cwd()
    });
  } catch (e) {
    console.log('Batch completed (some may have failed due to rate limits)');
  }
}

function buildGallery(): void {
  console.log('\nBuilding gallery from CSV...');
  try {
    execSync(
      'npm run build:gallery:csv -- --images=.cache/smartblend_gallery/images --csv=.cache/smartblend_gallery/metadata.csv',
      { stdio: 'inherit', timeout: 60000, cwd: process.cwd() }
    );
  } catch (e) {
    console.log('Gallery build issue (may need manual check)');
  }
}

function runValidation(): void {
  console.log('\nRunning validation benchmark...');
  try {
    execSync('npm run benchmark:validation', { 
      stdio: 'inherit', 
      timeout: 120000, 
      cwd: process.cwd() 
    });
  } catch (e) {
    console.log('Validation issue (may need manual check)');
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        SmartBlend Expansion Loop                           ║');
  console.log(`║  Target: ${TARGET} images                                  ║`);
  console.log(`║  Max attempts: ${MAX_ATTEMPTS}                              ║`);
  console.log(`║  Delay between: ${values['delay-minutes']} min                        ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let currentCount = countImages();
  console.log(`Starting with ${currentCount} images\n`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && currentCount < TARGET; attempt++) {
    const remaining = TARGET - currentCount;
    const batchSize = Math.min(remaining + 3, 15); // Request a few extra + cap at 15
    
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`ATTEMPT ${attempt}/${MAX_ATTEMPTS}: Need ${remaining} more images`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    runSmartBlend(batchSize);
    
    // Check new count
    const newCount = countImages();
    console.log(`\nImages: ${currentCount} → ${newCount}`);
    
    if (newCount >= TARGET) {
      console.log(`\n✅ TARGET REACHED: ${newCount} images`);
      break;
    }
    
    if (newCount === currentCount && attempt < MAX_ATTEMPTS) {
      console.log(`\n⏱️ No new images. Waiting ${values['delay-minutes']} minutes before retry...`);
      await sleep(DELAY_MS);
    }
    
    currentCount = newCount;
  }

  // Final build and validation
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FINALIZING');
  console.log('═══════════════════════════════════════════════════════════════\n');

  buildGallery();
  runValidation();

  const finalCount = countImages();
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`EXPANSION COMPLETE: ${finalCount}/${TARGET} images`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (finalCount >= TARGET * 0.8) {
    console.log('✅ Sufficient images for statistical confidence');
  } else {
    console.log('⚠️ Below target. Run again later when rate limits reset.');
  }
}

main().catch(console.error);
