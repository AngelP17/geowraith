# GeoWraith Project Status

**Date:** 2026-02-25  
**Status:** VALIDATED COARSE GEOLOCATION (WEAK REAL-WORLD ACCURACY)  
**Classification:** Coarse geolocation system (~176 km median error on 32 images)

---

## Verified in This Workspace

| Check | Status | Evidence |
|-------|--------|----------|
| Frontend lint | ✅ | `npm run lint` |
| Frontend build | ✅ | `npm run build` |
| Backend lint | ✅ | `npm run lint` |
| Backend build | ✅ | `npm run build` |
| Backend tests | ✅ | `npm run test` (5/5) |
| Offline mode | ✅ | `GEOWRAITH_OFFLINE=1 npm run test` (5/5) |
| HNSW benchmark | ✅ | `npm run benchmark:search` (121x–176x faster) |
| Real‑world validation | ✅ | 32 landmark photos tested |
| SmartBlend | ✅ | Openverse PD/CC0 + cached fallbacks |

---

## Real‑World Accuracy (Verified)

Median error: **176 km** (32 landmarks)  
Within 100 km: **43.8%**  
Within 1,000 km: **62.5%**

Large outliers exist (max ~12,972 km).

---

## What Works

- Coarse regional geolocation
- Offline operation (no API keys required)
- ANN search over cached reference index
- SmartBlend multi‑source image acquisition (Openverse PD/CC0)

---

## What It Is NOT

- Meter‑level precision
- Reliable for generic scenes or indoor shots
- Suitable for emergency services

---

## Quick Start

```bash
# Acquire validation images (SmartBlend)
cd backend
npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified

# Build gallery & validate
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

---

## Note

This status reflects the **current workspace**. Accuracy is based on a 32‑image landmark set sourced via SmartBlend. Expand the dataset for stronger statistical claims.
