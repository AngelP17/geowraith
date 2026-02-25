# GeoWraith Accuracy Assessment

**Date:** 2026-02-25  
**Status:** VALIDATED COARSE GEOLOCATION (WEAK REAL-WORLD ACCURACY)  
**Confidence:** 0.92

---

## Executive Summary

GeoWraith is a **coarse geolocation system**. It is **not** meter-level precise.

**Verified real‑world result (32 landmark photos, SmartBlend + Openverse PD/CC0):**
- **Median error:** 176 km
- **Mean error:** 2,274 km (large outliers)
- **Within 100 km:** 43.8%
- **Within 1,000 km:** 62.5%

---

## Verified Accuracy (Real Images)

Validation run on **32 landmark photos** sourced via SmartBlend (Openverse PD/CC0 + unverified sources). See `backend/.cache/validation_gallery/benchmark_report.json`.

**Key errors:**
- **Best case:** 8.6 km (Big Ben)
- **Worst case:** 12,971.5 km (Times Square)
- **Notable outliers:** Grand Canyon (8,317 km), Christ the Redeemer (7,708 km), Moai Statues (9,411 km), Louvre (9,797 km)

**Summary:**
- **Median error:** 176 km
- **Within 100 km:** 43.8%
- **Within 1,000 km:** 62.5%

---

## What This Means

### ✅ GeoWraith Is Good For
- **Region/country identification** on iconic landmarks
- **Offline batch processing** where coarse location is acceptable

### ❌ GeoWraith Is NOT Good For
- **Precise GPS coordinates**
- **Emergency location services**
- **Generic scenes** (beaches, forests, generic buildings)
- **Indoor locations**

---

## Architecture Limitations

| Limitation | Impact | Solution (if any) |
|-----------|--------|------------------|
| Coordinate‑only reference index | No visual feature matching | Requires millions of real photos |
| GeoCLIP pretrained model | Region‑level, not fine‑grained | Requires fine‑tuning |
| No SfM/3D reconstruction | No pose refinement | Requires hloc/Colmap |

**To reach meter‑level would require:**
1. Dense photo database (millions of geotagged images)
2. SfM/3D reconstruction pipeline
3. Fine‑tuned models
4. Significant compute resources

---

## Comparison: Synthetic vs Real‑World

| Benchmark | Median Error | Notes |
|-----------|--------------|-------|
| Synthetic (7,200 samples) | ~8.8 km | Optimistic by design |
| Real landmarks (32 images) | **176 km** | Actual performance |

Synthetic benchmarks remain **~16x more optimistic** than real images.

---

## Dataset Expansion

**Current:** 32 images  
**Target:** 50+ images for stronger statistical confidence

To expand:
```bash
cd backend
npm run smartblend -- --min-images=50 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified
npm run build:gallery:csv -- \
  --images=.cache/smartblend_gallery/images \
  --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

---

## Conclusion

GeoWraith is **validated** as a **coarse regional geolocation** system. It narrows to broad regions on many landmarks but is **not reliable** for city‑level precision and cannot claim meter‑level accuracy.

**Marketing must reflect reality:**
- ✅ "Coarse regional geolocation (~176 km median on 32 landmarks)"
- ❌ "Meter‑level geolocation"
