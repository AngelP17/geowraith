# SmartBlend Validation System

**Resilient, multi‑source validation pipeline**

> **Quick Links:** [README](README.md) | [Architecture](ARCHITECTURE.md) | [AGENTS](AGENTS.md) | [Status](STATUS.md) | [VALIDATION_GUIDE](VALIDATION_GUIDE.md)

SmartBlend provides multiple ways to build validation datasets:

1. **Multi-Source Downloader** — Direct Wikimedia Commons downloads
2. **SmartBlend Auto** — Multi-strategy with fallbacks
3. **CSV Import** — Use your own photos

---

## Method 1: Multi-Source Downloader (Recommended)

Direct download from Wikimedia Commons with polite rate limiting (license varies):

```bash
cd backend

# Download 30 landmarks with 3-second delays
npm run download:images -- --count=30 --delay=3000

# Build gallery & validate
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv

npm run benchmark:validation
```

---

## Method 2: SmartBlend Auto

Multi-strategy pipeline with automatic fallbacks:

```bash
cd backend
npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

Strategies:
- `auto`: Openverse (PD/CC0) + cache fallback (default)
- `aggressive`: Uses placeholders if all sources fail
- `conservative`: Only real downloads

Flags:
- `--allow-unverified`: Allow direct URL fallbacks when PD/CC0 coverage is insufficient.

---

## Database

35 landmarks across all continents:
- Europe: Eiffel Tower, Big Ben, Colosseum, Brandenburg Gate, Sagrada Familia, Notre-Dame
- Asia: Taj Mahal, Great Wall, Mount Fuji, Burj Khalifa, Petra
- North America: Statue of Liberty, Golden Gate Bridge, Grand Canyon, Chichen Itza, Mount Rushmore, Niagara Falls
- South America: Machu Picchu, Christ the Redeemer
- Africa: Pyramids of Giza
- Oceania: Sydney Opera House, Uluru

---

## Output

```
backend/.cache/smartblend_gallery/
  images/           # Downloaded landmark photos
  metadata.csv      # Coordinates and labels
```

---

## Current Results

**32 images validated:**
- Median error: **176 km**
- Within 100 km: **43.8%**
- Within 1,000 km: **62.5%**

Expand to 30+ for stronger statistical confidence.
