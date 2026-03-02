/**
 * Pre-flight check for memory-intensive benchmark
 * Ensures M4 24GB has enough headroom before running LLM verifier
 */

import * as os from 'os';
import { VERIFIER_CONFIG } from '../config.js';

interface MemoryStatus {
  totalGB: number;
  freeGB: number;
  usedGB: number;
  percentUsed: number;
}

interface ModelFootprint {
  label: string;
  modelGb: number;
  recommendedFreeGb: number;
}

function getModelFootprint(model: string): ModelFootprint {
  if (model.includes('qwen3.5:9b')) {
    return {
      label: 'qwen3.5:9b',
      modelGb: 6.6,
      recommendedFreeGb: 2,
    };
  }
  if (model.includes('qwen3.5:27b')) {
    return {
      label: 'qwen3.5:27b',
      modelGb: 17,
      recommendedFreeGb: 4,
    };
  }
  if (model.includes('35b')) {
    return {
      label: model,
      modelGb: 23,
      recommendedFreeGb: 6,
    };
  }
  return {
    label: model,
    modelGb: 8,
    recommendedFreeGb: 3,
  };
}

function getMemoryStatus(): MemoryStatus {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  
  return {
    totalGB: Math.round(total / 1024 / 1024 / 1024 * 10) / 10,
    freeGB: Math.round(free / 1024 / 1024 / 1024 * 10) / 10,
    usedGB: Math.round(used / 1024 / 1024 / 1024 * 10) / 10,
    percentUsed: Math.round(used / total * 100),
  };
}

function checkMemory(): { ok: boolean; warnings: string[] } {
  const mem = getMemoryStatus();
  const warnings: string[] = [];
  const footprint = getModelFootprint(VERIFIER_CONFIG.model);
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          LOCAL VERIFIER MEMORY CHECK                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total RAM: ${mem.totalGB} GB`);
  console.log(`Used: ${mem.usedGB} GB (${mem.percentUsed}%)`);
  console.log(`Free: ${mem.freeGB} GB\n`);
  console.log(`Configured verifier model: ${footprint.label}\n`);
  
  if (mem.freeGB < footprint.recommendedFreeGb) {
    warnings.push(
      `⚠️  Only ${mem.freeGB}GB free. ${footprint.label} is more reliable with at least ` +
      `${footprint.recommendedFreeGb}GB free.`,
    );
  }
  
  if (mem.freeGB < 2) {
    warnings.push(`❌ Critical: Only ${mem.freeGB}GB free. Benchmark will likely fail.`);
  }
  
  // Model memory breakdown
  console.log('Expected memory usage during benchmark:');
  console.log(`  ${footprint.label} model:     ~${footprint.modelGb} GB`);
  console.log('  GeoCLIP ONNX runtime:  ~2 GB');
  console.log('  macOS + other apps:    ~2 GB');
  console.log('  ───────────────────────────────');
  console.log(
    `  Total required:        ~${(footprint.modelGb + 4).toFixed(1)} GB\n`,
  );
  
  if (warnings.length === 0) {
    console.log('✅ Memory looks good! Ready to benchmark.\n');
  } else {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  }
  
  return { ok: warnings.length === 0 || mem.freeGB >= 2, warnings };
}

async function main() {
  const { ok, warnings } = checkMemory();
  
  if (!ok) {
    console.log('❌ Aborting benchmark due to low memory.\n');
    console.log('Recommended actions:');
    console.log('  1. Close Chrome/Safari tabs');
    console.log('  2. Quit memory-heavy apps (Slack, Teams, etc.)');
    console.log('  3. Run: npm run benchmark:validation');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Proceeding with caution. Performance may be degraded.\n');
  }
  
  console.log('✅ Ready to run benchmark!\n');
  console.log(
    'Run: GEOWRAITH_USE_UNIFIED_INDEX=true GEOWRAITH_ENABLE_VERIFIER=true npm run benchmark:validation',
  );
  process.exit(0);
}

main().catch(console.error);
