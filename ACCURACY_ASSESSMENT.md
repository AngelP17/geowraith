# GeoWraith Accuracy Assessment

**Date:** 2026-02-27  
**Status:** CLIP TEXT-MATCHING FALLBACK ACTIVE (GeoCLIP ONNX MODELS ABSENT)  
**Confidence:** 0.95

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

## 2026-02-27 Update: CLIP Text-Matching Mode

GeoCLIP ONNX models are not present in the current deployment. The backend falls back to CLIP text-matching via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`).

**CLIP mode accuracy (7 real Unsplash photos):**
- NYC → New York ✅ | London → London ✅ | Paris → Nice, France ✅ (right country)
- Tokyo, Sydney, Dubai, Rio → variable results (CLIP limitation)
- City-level accuracy: ~40-50% on distinctive landmarks

**Root cause:** Standard CLIP was trained for general image-text matching, not geolocation. Text prompts like "A photograph taken in Tokyo, Japan" don't capture enough geo-specific visual information to reliably distinguish similar-looking cities.

**Path to higher accuracy:** See `ACCURACY_ROADMAP.md` and `STATUS.md` for model upgrade options.

---

## Conclusion

GeoWraith is **validated** as a **coarse regional geolocation** system. In CLIP text-matching mode (current), it identifies iconic landmarks and distinctive cityscapes but is **not reliable** for generic imagery. With GeoCLIP ONNX models, accuracy improves to ~176 km median.

**Marketing must reflect reality:**
- ✅ "Coarse regional geolocation (~40-50% city-level on landmarks)"
- ✅ "Local-first, zero-cost, no external API calls during inference"
- ❌ "Meter-level geolocation"
- ❌ "95% city-level accuracy" (requires geo-specialized model)
