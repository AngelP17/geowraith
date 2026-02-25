# GeoWraith Validation Guide

**Date:** 2026-02-25  
**Status:** Real‑world accuracy validated on 32 images

---

## 1. Download Images (Multi-Source)

The multi-source downloader fetches landmark images from Wikimedia Commons (license varies):

```bash
cd backend
npm run download:images -- --count=30 --delay=3000
```

Options:
- `--count`: Number of landmarks to download (default: 30)
- `--delay`: Milliseconds between requests (default: 1000, use 3000+ to avoid rate limits)

---

## 2. Build Gallery & Validate

```bash
cd backend
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv

npm run benchmark:validation
```

---

## 3. Alternative: SmartBlend

SmartBlend combines multiple strategies with automatic fallbacks:

```bash
cd backend
npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

SmartBlend uses Openverse (PD/CC0) first. `--allow-unverified` enables direct URL fallbacks when public-domain coverage is insufficient.

---

## Current Results (32 Images)

| Metric | Value |
|--------|-------|
| Median error | **176 km** |
| Within 100 km | **43.8%** |
| Within 1,000 km | **62.5%** |

**Report location:**
```
backend/.cache/validation_gallery/benchmark_report.json
```

---

## Accuracy Policy

Do not claim meter‑level accuracy. Always rely on the generated report.
