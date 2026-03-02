import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { haversineMeters } from '../utils/geo.js';
import type { ImagePreprocessMode } from '../types.js';

const execFileAsync = promisify(execFile);
const INVESTIGATION_SCRIPT = path.resolve(process.cwd(), 'src/scripts/investigateHardFailures.ts');
const INVESTIGATION_REPORT = path.resolve(
  process.cwd(),
  '.cache/geoclip/hard_failure_investigation.json',
);
const OUTPUT_REPORT = path.resolve(process.cwd(), '.cache/geoclip/preprocessing_ablation.json');
const MODES: ImagePreprocessMode[] = [
  'none',
  'jpeg-only',
  'contain-224-jpeg',
  'cover-224-jpeg',
];

interface InvestigationReport {
  findings: Array<{
    filename: string;
    expected: { lat: number; lon: number };
    predicted: { lat: number; lon: number; radius_m: number };
    confidence: number;
    confidenceTier: string;
    qualityFlags: string[];
    topRawMatches: Array<{ label: string; similarity: number }>;
    topAnalysisMatches: Array<{ label: string; similarity: number }>;
  }>;
}

async function runMode(mode: ImagePreprocessMode): Promise<InvestigationReport> {
  await execFileAsync(
    'npx',
    ['tsx', INVESTIGATION_SCRIPT],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GEOWRAITH_USE_UNIFIED_INDEX: process.env.GEOWRAITH_USE_UNIFIED_INDEX ?? 'true',
        GEOWRAITH_IMAGE_PREPROCESS_MODE: mode,
      },
      maxBuffer: 8 * 1024 * 1024,
    },
  );

  const raw = await readFile(INVESTIGATION_REPORT, 'utf8');
  return JSON.parse(raw) as InvestigationReport;
}

function summarizeFinding(
  mode: ImagePreprocessMode,
  finding: InvestigationReport['findings'][number],
) {
  const errorKm = haversineMeters(finding.expected, finding.predicted) / 1000;
  return {
    mode,
    filename: finding.filename,
    errorKm: Number(errorKm.toFixed(1)),
    confidence: Number((finding.confidence * 100).toFixed(1)),
    confidenceTier: finding.confidenceTier,
    topPipelineLabel: finding.topRawMatches[0]?.label ?? 'n/a',
    topAnalysisLabel: finding.topAnalysisMatches[0]?.label ?? 'n/a',
    qualityFlags: finding.qualityFlags,
  };
}

async function main(): Promise<void> {
  const reports: Record<string, InvestigationReport> = {};
  const summaries: Array<ReturnType<typeof summarizeFinding>> = [];

  console.log('[PreprocessAblation] Running hard-failure preprocessing ablation');
  for (const mode of MODES) {
    console.log(`[PreprocessAblation] Mode: ${mode}`);
    const report = await runMode(mode);
    reports[mode] = report;
    for (const finding of report.findings) {
      summaries.push(summarizeFinding(mode, finding));
    }
  }

  await writeFile(
    OUTPUT_REPORT,
    `${JSON.stringify({ modes: MODES, summaries, reports }, null, 2)}\n`,
    'utf8',
  );

  console.log('\n[PreprocessAblation] Summary');
  for (const summary of summaries) {
    console.log(
      `${summary.filename.padEnd(28)} | ${summary.mode.padEnd(17)} | ` +
      `error ${String(summary.errorKm).padStart(7)}km | ` +
      `conf ${String(summary.confidence).padStart(5)}% | ` +
      `top ${summary.topPipelineLabel}`,
    );
  }
  console.log(`[PreprocessAblation] Saved report to ${OUTPUT_REPORT}`);
}

main().catch((error) => {
  console.error('[PreprocessAblation] Fatal error:', error);
  process.exit(1);
});
