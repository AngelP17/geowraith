# GeoWraith CSV Workflow Guide

**Build validation galleries from curated CSV templates or your own photos**

---

## Method 1: Multi-Source Downloader (Easiest)

Download landmark images automatically (license varies):

```bash
cd backend
npm run download:images -- --count=30 --delay=3000
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

---

## Method 2: Use Your Own Photos

### Step 1: Create CSV

```csv
filename,lat,lon,label,accuracy_radius
myhouse.jpg,40.7128,-74.0060,"My House NYC",10
paris_trip.jpg,48.8584,2.2945,"Eiffel Tower",30
```

### Step 2: Build Gallery

```bash
cd backend
npm run build:gallery:csv -- \
  --images=/path/to/your/photos \
  --csv=/path/to/your/metadata.csv
npm run benchmark:validation
```

---

## Current Validation Results

| Metric | Value |
|--------|-------|
| Median error | **176 km** |
| Within 100 km | **43.8%** |
| Within 1,000 km | **62.5%** |

**Dataset:** 32 images  
**Target:** 50+ for statistical confidence

---

## Accuracy Policy

Do not claim meter‑level accuracy without a real‑image benchmark. Always rely on the generated report:

```
backend/.cache/validation_gallery/benchmark_report.json
```
