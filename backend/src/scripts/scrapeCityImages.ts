/**
 * City-Level Image Scraper
 *
 * Scrapes city-specific image datasets from multiple sources.
 *
 * Usage:
 *   npx tsx src/scripts/scrapeCityImages.ts --city="Istanbul" --count=1000
 */

import { mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fetchOpenverseImages } from './city/openverse.js';
import { fetchWikimediaImages, fetchWikimediaSearchImages } from './city/wikimedia.js';
import { fetchFlickrImages } from './city/flickr.js';
import { downloadImage, saveMetadata } from './city/downloader.js';
import type { CityImage, CityScrapeConfig } from './city/types.js';
import { CITY_CATEGORIES, getSearchQueries } from './city/config.js';

const { values } = parseArgs({
  options: {
    'city': { type: 'string' },
    'category': { type: 'string' },
    'count': { type: 'string', default: '500' },
    'output': { type: 'string', default: '.cache/city_datasets' },
    'sources': { type: 'string', default: 'openverse,wikimedia,flickr' },
    'licenses': { type: 'string', default: 'cc0,pdm' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const FETCH_TIMEOUT_MS = 30000;
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeCityKey(cityName: string): string {
  return cityName.toLowerCase().replace(/\s+/g, '_');
}

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value.split(',').map(entry => entry.trim()).filter(Boolean);
}

function getConfig(): CityScrapeConfig {
  const cityName = values.city;
  if (!cityName) {
    throw new Error('Missing --city argument');
  }

  const category = values.category || CITY_CATEGORIES[cityName] || cityName;
  const count = parseInt(values.count!, 10);
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('Invalid --count value');
  }

  const outputDir = path.resolve(process.cwd(), values.output!);
  const cityDir = path.join(outputDir, normalizeCityKey(cityName));
  const imagesDir = path.join(cityDir, 'images');

  return {
    cityName,
    category,
    count,
    outputDir: cityDir,
    imagesDir,
    sources: parseList(values.sources),
    licenses: parseList(values.licenses),
    dryRun: Boolean(values['dry-run']),
  };
}

function logHeader(config: CityScrapeConfig): void {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         City-Level Image Scraper (Multi-Source)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`City: ${config.cityName}`);
  console.log(`Category: Category:${config.category}`);
  console.log(`Target: ${config.count} images`);
  console.log(`Sources: ${config.sources.join(', ') || 'none'}`);
  console.log(`Licenses: ${config.licenses.join(',') || 'none'}`);
  console.log(`Dry run: ${config.dryRun}\n`);
}

async function collectImages(config: CityScrapeConfig): Promise<CityImage[]> {
  let collected: CityImage[] = [];
  let wikiContinue: string | undefined;
  let openverseNext: string | undefined;
  const searchOffsets = new Map<string, string | undefined>();
  let flickrQueryIndex = 0;
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  let batchCount = 0;
  const searchQueries = getSearchQueries(config.cityName);

  while (collected.length < config.count) {
    batchCount += 1;
    const remaining = config.count - collected.length;
    process.stdout.write(`  Batch ${batchCount}... `);

    let batch: CityImage[] = [];
    if (config.sources.includes('openverse')) {
      try {
        const result = await fetchOpenverseImages(
          config.cityName,
          remaining,
          config.licenses,
          FETCH_TIMEOUT_MS,
          openverseNext
        );
        batch = batch.concat(result.images);
        openverseNext = result.continueToken;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[CityScraper] Openverse fetch failed: ${message}`);
      }
    }

    if (config.sources.includes('wikimedia')) {
      try {
        const result = await fetchWikimediaImages(
          config.category,
          remaining,
          FETCH_TIMEOUT_MS,
          wikiContinue
        );
        batch = batch.concat(result.images);
        wikiContinue = result.continueToken;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[CityScraper] Wikimedia fetch failed: ${message}`);
      }
    }

    if (config.sources.includes('wikimedia') && !wikiContinue) {
      for (const query of searchQueries) {
        try {
          const result = await fetchWikimediaSearchImages(
            query,
            remaining,
            FETCH_TIMEOUT_MS,
            searchOffsets.get(query) ? Number(searchOffsets.get(query)) : undefined
          );
          if (result.images.length > 0) {
            batch = batch.concat(result.images);
            searchOffsets.set(query, result.continueToken);
            break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`[CityScraper] Wikimedia search failed (${query}): ${message}`);
        }
      }
    }

    if (config.sources.includes('flickr')) {
      try {
        const flickrQuery = searchQueries[flickrQueryIndex % searchQueries.length] ?? config.cityName;
        const result = await fetchFlickrImages(
          flickrQuery,
          remaining,
          FETCH_TIMEOUT_MS
        );
        batch = batch.concat(result.images);
        flickrQueryIndex += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[CityScraper] Flickr fetch failed: ${message}`);
      }
    }

    if (batch.length === 0) {
      console.log('no more images');
      break;
    }

    const deduped = batch.filter((item) => {
      if (seenUrls.has(item.url) || seenTitles.has(item.title)) {
        return false;
      }
      seenUrls.add(item.url);
      seenTitles.add(item.title);
      return true;
    });

    collected = collected.concat(deduped);
    console.log(`+${deduped.length} (total: ${collected.length})`);

    const hasMore = Boolean(openverseNext || wikiContinue || Array.from(searchOffsets.values()).some(Boolean));
    if (deduped.length === 0 && !hasMore) {
      console.log('  No new images available');
      break;
    }

    if (!openverseNext && !wikiContinue && batch.length === 0) {
      console.log('  Reached end of sources');
      break;
    }

    await sleep(500);
  }

  return collected.slice(0, config.count);
}



async function main() {
  const config = getConfig();
  logHeader(config);

  if (config.dryRun) {
    console.log('Dry run - no files will be downloaded.');
    console.log(`Output: ${config.outputDir}`);
    console.log(`Images: ${config.imagesDir}\n`);
    return;
  }

  await mkdir(config.imagesDir, { recursive: true });
  console.log('Fetching image list...\n');

  const images = await collectImages(config);
  console.log(`\nFound ${images.length} images, downloading...\n`);

  const metadata: Array<{
    filename: string;
    title: string;
    source: string;
    width: number;
    height: number;
    size: number;
  }> = [];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i]!;
    const filename = `${normalizeCityKey(config.cityName)}_${String(i + 1).padStart(4, '0')}.jpg`;
    const outputPath = path.join(config.imagesDir, filename);

    process.stdout.write(`[${i + 1}/${images.length}] ${img.title.substring(0, 40)}... `);

    try {
      const result = await downloadImage(img, config.imagesDir, i);
      if (result.success) {
        metadata.push({
          filename: result.filename || filename,
          title: img.title,
          source: img.source,
          width: img.width,
          height: img.height,
          size: result.size || img.size,
        });
        successCount += 1;
        console.log('✓');
      } else {
        failCount += 1;
        console.log(`✗ ${result.error || ''}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failCount += 1;
      console.log(`✗ ${message}`);
    }

    if (i < images.length - 1) {
      await sleep(300);
    }
  }

  await saveMetadata(config.imagesDir, metadata);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SCRAPE SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ Downloaded: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`\nOutput: ${config.outputDir}`);
  console.log(`Images: ${config.imagesDir}`);
  console.log(`Metadata: ${path.join(config.outputDir, 'metadata.csv')}\n`);
}

main().catch((error) => {
  console.error('[CityScraper] Fatal error:', error);
  process.exit(1);
});
