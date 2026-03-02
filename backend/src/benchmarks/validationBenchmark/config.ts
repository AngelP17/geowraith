import path from 'node:path';

export interface BenchmarkConfig {
  name: string;
  galleryDir: string;
  manifestPath: string;
  reportPath: string;
  leakagePrefixes: string[];
}

function inferBenchmarkName(galleryDir: string): string {
  const base = path.basename(galleryDir).replace(/_gallery$/i, '');
  const words = base.split(/[_-]+/).filter(Boolean);
  if (words.length === 0) return 'Validation';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function inferLeakagePrefixes(galleryDir: string): string[] {
  const base = path.basename(galleryDir).replace(/_gallery$/i, '');
  return base ? [`${base}_`] : [];
}

export function getBenchmarkConfig(): BenchmarkConfig {
  const galleryDir = path.resolve(
    process.cwd(),
    process.env.GEOWRAITH_BENCHMARK_DIR ?? '.cache/validation_gallery',
  );
  const name = process.env.GEOWRAITH_BENCHMARK_NAME ?? inferBenchmarkName(galleryDir);

  return {
    name,
    galleryDir,
    manifestPath: path.join(galleryDir, 'manifest.json'),
    reportPath: path.join(galleryDir, 'benchmark_report.json'),
    leakagePrefixes: inferLeakagePrefixes(galleryDir),
  };
}
