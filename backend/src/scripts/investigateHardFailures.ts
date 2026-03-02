import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { extractImageSignals } from '../services/imageSignals.js';
import { getReferenceVectors } from '../services/geoclipIndex.js';
import { preventCrossContinentErrors } from '../services/geoConstraints.js';
import { preprocessImageForInference } from '../services/imageProcessor.js';
import { runPredictPipeline } from '../services/predictPipeline.js';
import { searchNearestNeighborsWithFallback } from '../services/vectorSearch.js';
import { ensureImageAvailable } from '../benchmarks/validationBenchmark/image.js';
import { getBenchmarkConfig } from '../benchmarks/validationBenchmark/config.js';
import type { GalleryImage, GalleryManifest } from '../benchmarks/validationBenchmark/types.js';

interface TargetSpec {
  filenamePart: string;
  label: string;
}

interface LabelSupport {
  totalReferences: number;
  sourceBreakdown: Record<string, number>;
  bestRank: number | null;
  bestSimilarity: number | null;
  top50Count: number;
}

const TARGETS: TargetSpec[] = [
  { filenamePart: 'marrakech', label: 'Marrakech Medina' },
  { filenamePart: 'copacabana', label: 'Copacabana Beach' },
];
const REPORT_PATH = path.resolve(process.cwd(), '.cache/geoclip/hard_failure_investigation.json');

function getSourceFamily(id: string): string {
  if (id.startsWith('mapillary_')) return 'mapillary';
  if (id.startsWith('synthetic_')) return 'synthetic';
  if (id.startsWith('refined_')) return 'refined';
  if (id.startsWith('img_anchor_')) return 'image_anchor';
  if (id.startsWith('city_anchor_')) return 'city_anchor';
  if (id.startsWith('osv-')) return 'osv';
  return 'base';
}

function summarizeLabelSupport(
  label: string,
  referenceVectors: Awaited<ReturnType<typeof getReferenceVectors>>,
  matches: Awaited<ReturnType<typeof searchNearestNeighborsWithFallback>>,
): LabelSupport {
  const matchingReferences = referenceVectors.filter((vector) => vector.label === label);
  const sourceBreakdown: Record<string, number> = {};
  for (const vector of matchingReferences) {
    const family = getSourceFamily(vector.id);
    sourceBreakdown[family] = (sourceBreakdown[family] ?? 0) + 1;
  }

  let bestRank: number | null = null;
  let bestSimilarity: number | null = null;
  let top50Count = 0;
  for (let i = 0; i < matches.length; i += 1) {
    if (matches[i]!.label !== label) continue;
    if (bestRank === null) {
      bestRank = i + 1;
      bestSimilarity = matches[i]!.similarity;
    }
    if (i < 50) top50Count += 1;
  }

  return {
    totalReferences: matchingReferences.length,
    sourceBreakdown,
    bestRank,
    bestSimilarity,
    top50Count,
  };
}

function deriveQualityFlags(image: GalleryImage): string[] {
  const flags: string[] = [];
  const width = image.image_info.width;
  const height = image.image_info.height;
  const aspectRatio = height > 0 ? width / height : 0;

  if (Math.max(width, height) < 800) {
    flags.push('small_source_image');
  }
  if (image.image_info.size_bytes < 150_000) {
    flags.push('aggressive_jpeg_compression_or_low_detail');
  }
  if (aspectRatio >= 2 || aspectRatio <= 0.5) {
    flags.push('extreme_aspect_ratio_for_center_crop_models');
  }

  return flags;
}

async function loadManifest(manifestPath: string): Promise<GalleryManifest> {
  const raw = await readFile(manifestPath, 'utf8');
  return JSON.parse(raw) as GalleryManifest;
}

async function investigateImage(
  image: GalleryImage,
  label: string,
  referenceVectors: Awaited<ReturnType<typeof getReferenceVectors>>,
) {
  const imageBuffer = await ensureImageAvailable(image);
  if (!imageBuffer) {
    throw new Error(`Failed to load benchmark image ${image.filename}`);
  }

  const originalSignals = await extractImageSignals(imageBuffer);
  const processedBuffer = config.enableUniversalImageFormat
    ? await preprocessImageForInference(imageBuffer, config.imagePreprocessMode)
    : imageBuffer;
  const processedSignals = await extractImageSignals(processedBuffer);
  const originalMatches = await searchNearestNeighborsWithFallback(originalSignals.vector, 20, true);
  const pipelineMatches = await searchNearestNeighborsWithFallback(
    processedSignals.vector,
    20,
    true,
  );
  const analysisMatches = await searchNearestNeighborsWithFallback(
    processedSignals.vector,
    50,
    true,
  );
  const filteredMatches = preventCrossContinentErrors(pipelineMatches);
  const prediction = await runPredictPipeline({
    image_base64: imageBuffer.toString('base64'),
    options: { mode: 'accurate' },
  });

  return {
    filename: image.filename,
    expected: image.coordinates,
    predicted: prediction.location,
    confidence: prediction.confidence,
    confidenceTier: prediction.confidence_tier,
    embeddingSource: processedSignals.embeddingSource,
    imageInfo: image.image_info,
    qualityFlags: deriveQualityFlags(image),
    labelSupport: summarizeLabelSupport(label, referenceVectors, analysisMatches),
    pipelinePreprocessing: {
      enabled: config.enableUniversalImageFormat,
      mode: config.imagePreprocessMode,
      originalEmbeddingSource: originalSignals.embeddingSource,
      originalMeta: originalSignals.meta,
      processedEmbeddingSource: processedSignals.embeddingSource,
      processedMeta: processedSignals.meta,
      originalTopLabels: originalMatches.slice(0, 5).map((match) => ({
        label: match.label,
        similarity: Number(match.similarity.toFixed(4)),
      })),
    },
    topRawMatches: pipelineMatches.slice(0, 8).map((match, index) => ({
      rank: index + 1,
      id: match.id,
      label: match.label,
      lat: match.lat,
      lon: match.lon,
      similarity: Number(match.similarity.toFixed(4)),
      sourceFamily: getSourceFamily(match.id),
    })),
    topFilteredMatches: filteredMatches.slice(0, 8).map((match, index) => ({
      rank: index + 1,
      id: match.id,
      label: match.label,
      lat: match.lat,
      lon: match.lon,
      similarity: Number(match.similarity.toFixed(4)),
      sourceFamily: getSourceFamily(match.id),
    })),
    topAnalysisMatches: analysisMatches.slice(0, 8).map((match, index) => ({
      rank: index + 1,
      id: match.id,
      label: match.label,
      lat: match.lat,
      lon: match.lon,
      similarity: Number(match.similarity.toFixed(4)),
      sourceFamily: getSourceFamily(match.id),
    })),
  };
}

type InvestigationFinding = Awaited<ReturnType<typeof investigateImage>>;

async function main(): Promise<void> {
  const benchmarkConfig = getBenchmarkConfig();
  const manifest = await loadManifest(benchmarkConfig.manifestPath);
  const referenceVectors = await getReferenceVectors();
  const findings: InvestigationFinding[] = [];

  console.log(`[HardFailureInvestigation] Using manifest ${benchmarkConfig.manifestPath}`);
  console.log(
    `[HardFailureInvestigation] Active reference vectors: ${referenceVectors.length}`,
  );

  for (const target of TARGETS) {
    const image = manifest.images.find((item) => item.filename.includes(target.filenamePart));
    if (!image) {
      throw new Error(`Target ${target.filenamePart} not found in benchmark manifest`);
    }

    console.log(`[HardFailureInvestigation] Investigating ${image.filename}`);
    findings.push(await investigateImage(image, target.label, referenceVectors));
  }

  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(REPORT_PATH, `${JSON.stringify({ findings }, null, 2)}\n`, 'utf8'),
  );
  console.log(`[HardFailureInvestigation] Saved report to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error('[HardFailureInvestigation] Fatal error:', error);
  process.exit(1);
});
