import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { WORLD_CITIES } from '../data/worldCities.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ReferenceVectorRecord } from '../types.js';
import { extractCLIPEmbedding } from './clipExtractor.js';
interface CachedImageVectors {
  version?: string;
  vectors?: unknown[];
}

interface SmartBlendRow {
  filename: string;
  lat: number;
  lon: number;
  label: string;
}

const IMAGE_VECTOR_VERSION = 'merged_v1';
const SMARTBLEND_METADATA_CSV = path.resolve(process.cwd(), '.cache/smartblend_gallery/metadata.csv');
const SMARTBLEND_IMAGES_DIR = path.resolve(process.cwd(), '.cache/smartblend_gallery/images');
const CITY_DATASETS_DIR = path.resolve(process.cwd(), '.cache/city_datasets');
const IMAGE_VECTOR_CACHE_FILE = path.resolve(
  process.cwd(),
  `.cache/geoclip/referenceImageVectors.${IMAGE_VECTOR_VERSION}.json`
);
const MAX_ANCHOR_IMAGES = 200;
const MAX_CITY_ANCHORS_PER_CITY = 24;
let imageVectorPromise: Promise<ReferenceVectorRecord[]> | null = null;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function normalizeReference(input: unknown): ReferenceVectorRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('invalid image reference vector record');
  }
  const obj = input as Partial<ReferenceVectorRecord>;
  if (typeof obj.id !== 'string' || !obj.id) {
    throw new Error('missing reference vector id');
  }
  if (typeof obj.label !== 'string' || !obj.label) {
    throw new Error(`missing reference vector label for ${obj.id}`);
  }
  if (!Number.isFinite(obj.lat) || !Number.isFinite(obj.lon)) {
    throw new Error(`invalid lat/lon for ${obj.id}`);
  }
  if (!Array.isArray(obj.vector) || obj.vector.length !== FEATURE_VECTOR_SIZE) {
    throw new Error(`invalid embedding length for ${obj.id}`);
  }
  return {
    id: obj.id,
    label: obj.label,
    lat: Number(obj.lat),
    lon: Number(obj.lon),
    vector: obj.vector.map((value) => (Number.isFinite(value) ? Number(value) : 0)),
  };
}

async function loadCachedImageVectors(): Promise<ReferenceVectorRecord[] | null> {
  try {
    const raw = await readFile(IMAGE_VECTOR_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as CachedImageVectors;
    if (parsed.version !== IMAGE_VECTOR_VERSION || !Array.isArray(parsed.vectors)) {
      return null;
    }
    return parsed.vectors.map((item) => normalizeReference(item));
  } catch {
    return null;
  }
}

async function saveCachedImageVectors(vectors: ReferenceVectorRecord[]): Promise<void> {
  await mkdir(path.dirname(IMAGE_VECTOR_CACHE_FILE), { recursive: true });
  await writeFile(
    IMAGE_VECTOR_CACHE_FILE,
    JSON.stringify({
      version: IMAGE_VECTOR_VERSION,
      vectors,
    })
  );
}

async function loadSmartBlendRows(): Promise<SmartBlendRow[]> {
  try {
    await access(SMARTBLEND_METADATA_CSV);
  } catch {
    return [];
  }

  const raw = await readFile(SMARTBLEND_METADATA_CSV, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const filenameIndex = header.indexOf('filename');
  const latIndex = header.indexOf('lat');
  const lonIndex = header.indexOf('lon');
  const labelIndex = header.indexOf('label');
  if (filenameIndex < 0 || latIndex < 0 || lonIndex < 0 || labelIndex < 0) {
    return [];
  }

  const rows: SmartBlendRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const filename = cols[filenameIndex] ?? '';
    const label = cols[labelIndex] ?? filename;
    const lat = Number(cols[latIndex]);
    const lon = Number(cols[lonIndex]);
    if (!filename || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }
    rows.push({ filename, label, lat, lon });
  }

  rows.sort((a, b) => a.filename.localeCompare(b.filename));
  return rows.slice(0, MAX_ANCHOR_IMAGES);
}

async function buildImageVectorsFromSmartBlend(): Promise<ReferenceVectorRecord[]> {
  const rows = await loadSmartBlendRows();
  if (rows.length === 0) {
    return [];
  }

  const vectors: ReferenceVectorRecord[] = [];
  for (const row of rows) {
    const imagePath = path.resolve(SMARTBLEND_IMAGES_DIR, row.filename);
    try {
      const imageBuffer = await readFile(imagePath);
      const embedding = await extractCLIPEmbedding(imageBuffer);
      vectors.push({
        id: `img_anchor_${path.parse(row.filename).name}`,
        label: `${row.label} (image-anchor)`,
        lat: row.lat,
        lon: row.lon,
        vector: embedding,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`[GeoCLIP] Skipping image anchor ${row.filename}:`, error);
    }
  }

  if (vectors.length === 0) {
    return [];
  }
  return vectors;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCityCenter(citySlug: string): { lat: number; lon: number } | null {
  const normalizedSlug = normalizeText(citySlug);
  if (!normalizedSlug) return null;

  const direct = WORLD_CITIES.find((city) => normalizeText(city.name).startsWith(normalizedSlug));
  if (direct) return { lat: direct.lat, lon: direct.lon };

  const includes = WORLD_CITIES.find((city) => normalizeText(city.name).includes(normalizedSlug));
  if (includes) return { lat: includes.lat, lon: includes.lon };

  return null;
}

async function loadCityDatasetRows(
  citySlug: string
): Promise<Array<{ filename: string; label: string; lat: number; lon: number }>> {
  const center = resolveCityCenter(citySlug);
  if (!center) return [];

  const metadataPath = path.resolve(CITY_DATASETS_DIR, citySlug, 'metadata.csv');
  try {
    await access(metadataPath);
  } catch {
    return [];
  }

  const raw = await readFile(metadataPath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const filenameIndex = header.indexOf('filename');
  const titleIndex = header.indexOf('title');
  if (filenameIndex < 0) return [];

  const rows: Array<{ filename: string; label: string; lat: number; lon: number }> = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const filename = cols[filenameIndex] ?? '';
    if (!filename) continue;
    rows.push({
      filename,
      label: (cols[titleIndex] ?? citySlug).slice(0, 120),
      lat: center.lat,
      lon: center.lon,
    });
  }

  rows.sort((a, b) => a.filename.localeCompare(b.filename));
  return rows.slice(0, MAX_CITY_ANCHORS_PER_CITY);
}

async function buildImageVectorsFromCityDatasets(): Promise<ReferenceVectorRecord[]> {
  let cityDirs: string[] = [];
  try {
    const entries = await readdir(CITY_DATASETS_DIR, { withFileTypes: true });
    cityDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }

  const vectors: ReferenceVectorRecord[] = [];
  for (const citySlug of cityDirs.sort()) {
    const rows = await loadCityDatasetRows(citySlug);
    for (const row of rows) {
      const imagePath = path.resolve(CITY_DATASETS_DIR, citySlug, 'images', row.filename);
      try {
        const imageBuffer = await readFile(imagePath);
        const embedding = await extractCLIPEmbedding(imageBuffer);
        vectors.push({
          id: `city_anchor_${citySlug}_${path.parse(row.filename).name}`,
          label: `${row.label} (city-anchor)`,
          lat: row.lat,
          lon: row.lon,
          vector: embedding,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`[GeoCLIP] Skipping city anchor ${citySlug}/${row.filename}:`, error);
      }
    }
  }

  return vectors;
}

/** Load additional image-anchor vectors built from multi-source SmartBlend images. */
export async function getReferenceImageVectors(): Promise<ReferenceVectorRecord[]> {
  if (!imageVectorPromise) {
    imageVectorPromise = (async () => {
      const cached = await loadCachedImageVectors();
      if (cached && cached.length > 0) {
        return cached;
      }
      const [smartBlendVectors, cityVectors] = await Promise.all([
        buildImageVectorsFromSmartBlend(),
        buildImageVectorsFromCityDatasets(),
      ]);
      const vectors = [...smartBlendVectors, ...cityVectors];
      if (vectors.length === 0) return [];
      try {
        await saveCachedImageVectors(vectors);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[GeoCLIP] Unable to persist multi-source image-anchor cache:', error);
      }
      return vectors;
    })();
  }
  return imageVectorPromise;
}
