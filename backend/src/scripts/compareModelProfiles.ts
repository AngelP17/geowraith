import { execFile } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const BENCHMARK_SCRIPT = path.resolve(process.cwd(), 'src/benchmarks/validationBenchmark.ts');
const OUTPUT_DIR_BY_BENCHMARK = {
  validation: '.cache/validation_gallery',
  holdout: '.cache/holdout_gallery',
} as const;

interface AccuracyReport {
  summary: {
    totalImages: number;
    meanErrorM: number;
    p95ErrorM: number;
    p99ErrorM: number;
    maxErrorM: number;
  };
  thresholds: {
    within100m: number;
    within1km: number;
    within10km: number;
  };
}

interface ProfileRunResult {
  profile: string;
  description: string;
  elapsedMs: number;
  report: AccuracyReport | null;
  status: 'ok' | 'crashed-after-report' | 'failed';
  stdout?: string;
  stderr?: string;
}

interface ProfileConfig {
  id: string;
  description: string;
  env: Record<string, string>;
}

const PROFILE_PRESETS: Record<string, ProfileConfig> = {
  'geoclip-unified': {
    id: 'geoclip-unified',
    description: 'GeoCLIP image embeddings + unified reference corpus',
    env: {
      GEOWRAITH_USE_UNIFIED_INDEX: 'true',
    },
  },
  'clip-city': {
    id: 'clip-city',
    description: 'CLIP image embeddings + CLIP city-text reference backend',
    env: {
      GEOWRAITH_USE_UNIFIED_INDEX: 'false',
      GEOWRAITH_USE_OSV_INDEX: 'false',
      GEOWRAITH_IMAGE_EMBEDDING_BACKEND: 'clip',
      GEOWRAITH_REFERENCE_BACKEND: 'clip',
    },
  },
};

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function getProfiles(): ProfileConfig[] {
  const requested = (getArg('profiles') ?? 'geoclip-unified,clip-city')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return requested.map((id) => {
    const profile = PROFILE_PRESETS[id];
    if (!profile) {
      throw new Error(`Unknown model profile "${id}"`);
    }
    return profile;
  });
}

async function runProfile(
  profile: ProfileConfig,
  benchmark: keyof typeof OUTPUT_DIR_BY_BENCHMARK,
): Promise<ProfileRunResult> {
  const startedAt = Date.now();
  const galleryDir = OUTPUT_DIR_BY_BENCHMARK[benchmark];
  const reportPath = path.resolve(process.cwd(), galleryDir, 'benchmark_report.json');

  const baseEnv = {
    ...process.env,
    GEOWRAITH_BENCHMARK_DIR: galleryDir,
    GEOWRAITH_BENCHMARK_NAME: benchmark === 'holdout' ? 'Holdout' : 'Validation',
    ...profile.env,
  };

  try {
    const output = await execFileAsync(
      'npx',
      ['tsx', BENCHMARK_SCRIPT],
      {
        cwd: process.cwd(),
        env: baseEnv,
        maxBuffer: 32 * 1024 * 1024,
      },
    );
    const report = JSON.parse(await readFile(reportPath, 'utf8')) as AccuracyReport;
    return {
      profile: profile.id,
      description: profile.description,
      elapsedMs: Date.now() - startedAt,
      report,
      status: 'ok',
      stdout: output.stdout,
      stderr: output.stderr,
    };
  } catch (error) {
    const failure = error as Error & {
      stdout?: string;
      stderr?: string;
      code?: number | string;
    };
    try {
      const metadata = await stat(reportPath);
      if (metadata.mtimeMs >= startedAt) {
        const report = JSON.parse(await readFile(reportPath, 'utf8')) as AccuracyReport;
        return {
          profile: profile.id,
          description: profile.description,
          elapsedMs: Date.now() - startedAt,
          report,
          status: 'crashed-after-report',
          stdout: failure.stdout,
          stderr: failure.stderr,
        };
      }
    } catch {
      // Fall through and record the failed profile without a report.
    }

    return {
      profile: profile.id,
      description: profile.description,
      elapsedMs: Date.now() - startedAt,
      report: null,
      status: 'failed',
      stdout: failure.stdout,
      stderr: failure.stderr,
    };
  }
}

async function main(): Promise<void> {
  const benchmark = (getArg('benchmark') ?? 'validation') as keyof typeof OUTPUT_DIR_BY_BENCHMARK;
  if (!(benchmark in OUTPUT_DIR_BY_BENCHMARK)) {
    throw new Error(`Unsupported benchmark "${benchmark}"`);
  }

  const profiles = getProfiles();
  const results: ProfileRunResult[] = [];
  for (const profile of profiles) {
    console.log(`[ModelProfiles] Running ${profile.id} on ${benchmark}`);
    results.push(await runProfile(profile, benchmark));
  }

  const outputPath = path.resolve(
    process.cwd(),
    `.cache/geoclip/model_profile_comparison.${benchmark}.json`,
  );
  await writeFile(
    outputPath,
    `${JSON.stringify({ benchmark, results }, null, 2)}\n`,
    'utf8',
  );

  console.log('\n[ModelProfiles] Summary');
  for (const result of results) {
    if (!result.report) {
      console.log(
        `${result.profile.padEnd(16)} | failed | ${result.elapsedMs}ms`,
      );
      continue;
    }
    console.log(
      `${result.profile.padEnd(16)} | ` +
      `100m ${(result.report.thresholds.within100m * 100).toFixed(1).padStart(5)}% | ` +
      `1km ${(result.report.thresholds.within1km * 100).toFixed(1).padStart(5)}% | ` +
      `10km ${(result.report.thresholds.within10km * 100).toFixed(1).padStart(5)}% | ` +
      `mean ${(result.report.summary.meanErrorM / 1000).toFixed(1).padStart(7)}km | ` +
      `p95 ${(result.report.summary.p95ErrorM / 1000).toFixed(1).padStart(7)}km | ` +
      `${result.elapsedMs}ms | ${result.status}`,
    );
  }
  console.log(`[ModelProfiles] Saved report to ${outputPath}`);
}

main().catch((error) => {
  console.error('[ModelProfiles] Fatal error:', error);
  process.exit(1);
});
