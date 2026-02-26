/**
 * Validation benchmark for GeoWraith using real-world geotagged images.
 * @deprecated Run from './validationBenchmark/index.ts' instead. This file is maintained for backward compatibility.
 *
 * Usage:
 *   npx tsx src/benchmarks/validationBenchmark/index.ts
 */

export * from './validationBenchmark/types.js';
export * from './validationBenchmark/geo.js';
export * from './validationBenchmark/stats.js';
export * from './validationBenchmark/image.js';
export * from './validationBenchmark/format.js';
export * from './validationBenchmark/runner.js';

// Import and re-export main for CLI compatibility
import { main } from './validationBenchmark/index.js';

export { main };
export { main as default };

// Run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error('[ValidationBenchmark] Fatal error:', error);
    process.exit(1);
  });
}
