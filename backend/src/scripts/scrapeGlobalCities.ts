import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { CITY_CATEGORIES } from './city/config.js';

const { values } = parseArgs({
  options: {
    'count': { type: 'string', default: '12' },
    'sources': { type: 'string', default: 'flickr,openverse,wikimedia,mapillary' },
    'output': { type: 'string', default: '.cache/city_datasets' },
    'cities': { type: 'string' },
    'start': { type: 'string' },
    'limit': { type: 'string' },
  },
});

interface ScrapeSummary {
  city: string;
  exitCode: number;
}

function normalizeList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveCityList(): string[] {
  const explicit = normalizeList(values.cities);
  const all = explicit.length > 0 ? explicit : Object.keys(CITY_CATEGORIES).sort();
  const start = values.start?.trim();
  const limit = Number.parseInt(values.limit ?? '', 10);

  let list = all;
  if (start) {
    const index = list.findIndex((city) => city.toLowerCase() === start.toLowerCase());
    if (index >= 0) {
      list = list.slice(index);
    }
  }
  if (Number.isFinite(limit) && limit > 0) {
    list = list.slice(0, limit);
  }
  return list;
}

function runCityScrape(city: string): Promise<number> {
  return new Promise((resolve) => {
    const args = [
      'run',
      'scrape:city',
      '--',
      `--city=${city}`,
      `--count=${values.count}`,
      `--sources=${values.sources}`,
      `--output=${values.output}`,
    ];

    const child = spawn('npm', args, {
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

async function main(): Promise<void> {
  const cities = resolveCityList();
  if (cities.length === 0) {
    throw new Error('No cities selected for global scrape');
  }

  const summary: ScrapeSummary[] = [];
  console.log(`Global city scrape starting for ${cities.length} cities`);
  console.log(`Sources: ${values.sources}`);
  console.log(`Per-city target: ${values.count}\n`);

  for (let i = 0; i < cities.length; i += 1) {
    const city = cities[i]!;
    console.log(`\n=== [${i + 1}/${cities.length}] ${city} ===`);
    const exitCode = await runCityScrape(city);
    summary.push({ city, exitCode });
  }

  const failures = summary.filter((item) => item.exitCode !== 0);
  console.log('\nGlobal scrape summary');
  console.log(`Total cities: ${summary.length}`);
  console.log(`Succeeded: ${summary.length - failures.length}`);
  console.log(`Failed: ${failures.length}`);
  if (failures.length > 0) {
    console.log(`Failed cities: ${failures.map((item) => item.city).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[GlobalCityScrape] Fatal error:', error);
  process.exit(1);
});
