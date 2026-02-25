/**
 * Build validation gallery from a local image folder + CSV metadata.
 *
 * Usage:
 *   npx tsx src/scripts/buildGalleryFromCSV.ts --images=/path/to/photos --csv=/path/to/metadata.csv
 *
 * CSV format (header required):
 *   filename,lat,lon,label,accuracy_radius
 */

import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

interface CsvRow {
  filename: string;
  lat: number;
  lon: number;
  label: string;
  accuracyRadius: number;
}

interface GalleryManifest {
  images: Array<{
    id: string;
    source: string;
    filename: string;
    url: string;
    local_path: string;
    coordinates: { lat: number; lon: number };
    accuracy_radius: number;
    image_info: {
      width: number;
      height: number;
      size_bytes: number;
      mime_type: string;
    };
    metadata: {
      title: string;
      description?: string;
      categories: string[];
    };
  }>;
  stats: {
    total: number;
    by_continent: Record<string, number>;
    by_country_estimate: Record<string, number>;
    by_scene_type: {
      urban: number;
      rural: number;
      landmark: number;
      nature: number;
      unknown: number;
    };
  };
  created_at: string;
}

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/validation_gallery');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

function getArg(args: string[], key: string): string | null {
  const hit = args.find((arg) => arg.startsWith(`${key}=`));
  return hit ? hit.slice(key.length + 1) : null;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must include header and at least one row');
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    filename: header.indexOf('filename'),
    lat: header.indexOf('lat'),
    lon: header.indexOf('lon'),
    label: header.indexOf('label'),
    accuracyRadius: header.indexOf('accuracy_radius'),
  };

  if (idx.filename < 0 || idx.lat < 0 || idx.lon < 0) {
    throw new Error('CSV header must include filename,lat,lon');
  }

  return lines.slice(1).map((line, rowIndex) => {
    const parts = parseCsvLine(line);
    const filename = parts[idx.filename] ?? '';
    const lat = Number(parts[idx.lat]);
    const lon = Number(parts[idx.lon]);
    const label = idx.label >= 0 ? (parts[idx.label] ?? '').trim() : '';
    const accuracyRadius = idx.accuracyRadius >= 0 ? Number(parts[idx.accuracyRadius]) : 30;

    if (!filename) {
      throw new Error(`Row ${rowIndex + 2}: filename is required`);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error(`Row ${rowIndex + 2}: invalid lat/lon`);
    }

    return {
      filename,
      lat,
      lon,
      label: label || filename,
      accuracyRadius: Number.isFinite(accuracyRadius) ? accuracyRadius : 30,
    };
  });
}

async function getImageInfo(localPath: string): Promise<{ width: number; height: number; size: number; mime: string }> {
  const meta = await sharp(localPath).metadata();
  const stats = await stat(localPath);
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    size: stats.size,
    mime: meta.format ? `image/${meta.format}` : 'image/unknown',
  };
}

async function main() {
  const args = process.argv.slice(2);
  const imagesDir = getArg(args, '--images');
  const csvPath = getArg(args, '--csv');

  if (!imagesDir || !csvPath) {
    throw new Error('Usage: --images=/path/to/photos --csv=/path/to/metadata.csv');
  }

  const csvRaw = await readFile(csvPath, 'utf8');
  const rows = parseCsv(csvRaw);

  await mkdir(IMAGES_DIR, { recursive: true });

  const manifest: GalleryManifest = {
    images: [],
    stats: {
      total: 0,
      by_continent: {},
      by_country_estimate: {},
      by_scene_type: {
        urban: 0,
        rural: 0,
        landmark: 0,
        nature: 0,
        unknown: 0,
      },
    },
    created_at: new Date().toISOString(),
  };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const sourcePath = path.isAbsolute(row.filename)
      ? row.filename
      : path.join(imagesDir, row.filename);

    const targetName = `${String(i + 1).padStart(4, '0')}_${path.basename(row.filename)}`;
    const targetPath = path.join(IMAGES_DIR, targetName);

    await copyFile(sourcePath, targetPath);
    const info = await getImageInfo(targetPath);

    manifest.images.push({
      id: `csv_${String(i + 1).padStart(4, '0')}`,
      source: 'csv',
      filename: targetName,
      url: '',
      local_path: targetPath,
      coordinates: { lat: row.lat, lon: row.lon },
      accuracy_radius: row.accuracyRadius,
      image_info: {
        width: info.width,
        height: info.height,
        size_bytes: info.size,
        mime_type: info.mime,
      },
      metadata: {
        title: row.label,
        categories: [],
      },
    });

    manifest.stats.total += 1;
    manifest.stats.by_scene_type.unknown += 1;
  }

  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[CSVGallery] Wrote ${manifest.stats.total} images to ${MANIFEST_FILE}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[CSVGallery] Fatal error:', error);
  process.exit(1);
});
