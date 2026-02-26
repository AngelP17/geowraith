# GeoWraith Baseline Metrics

**Date:** 2026-02-26  
**Baseline Phase:** Pre-MVP Completion  
**Purpose:** Establish empirical baseline before implementing improvements

---

## Current State (32 Images)

**Source:** `backend/.cache/validation_gallery/benchmark_report.json`

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total Images | 32 |
| Successful Predictions | 32 (100%) |
| Failed | 0 |
| Median Error | 176.4 km |
| Mean Error | 2,274 km |
| P95 Error | 11,954 km |
| P99 Error | 12,972 km |
| Min Error | 8.6 km |
| Max Error | 12,972 km |

### Accuracy Thresholds

| Distance | Success Rate |
|----------|-------------|
| Within 100m | 0% |
| Within 1km | 0% |
| Within 10km | 3.1% |
| Within 100km | 43.8% |
| Within 1000km | 62.5% |

### Performance by Continent

| Continent | Count | Median Error | Within 10km |
|-----------|-------|--------------|-------------|
| Europe | 12 | 142.7 km | 8.3% |
| Asia | 8 | 114.9 km | 0% |
| North America | 8 | 2,439 km | 0% |
| South America | 2 | 7,708 km | 0% |
| Oceania | 1 | 48.6 km | 0% |
| Unknown | 1 | 9,411 km | 0% |
| **Africa** | **0** | **N/A** | **N/A** |

### Confidence Analysis

All 32 predictions fell into "medium confidence" tier (0.4-0.7 range).
- High confidence (≥0.7): 0 images
- Medium confidence (0.4-0.7): 32 images
- Low confidence (<0.4): 0 images

This indicates confidence thresholds may need recalibration.

---

## Target Improvements (Post-MVP)

### Geographic Coverage Gaps

**Priority: Add African landmarks** (currently 0 images)
- Victoria Falls (Zambia/Zimbabwe)
- Table Mountain (South Africa)
- Great Sphinx (Egypt)
- Medina of Marrakech (Morocco)
- Mount Kilimanjaro (Tanzania)

### Expected Improvements

| Metric | Current | Target (50+ images) | Expected Improvement |
|--------|---------|--------------------|---------------------|
| Median Error | 176 km | 120-150 km | 15-30% reduction |
| Within 100km | 43.8% | 50-55% | Better coverage |
| African coverage | 0% | 10-15% | Geographic diversity |

---

## Methodology

### Benchmark Command
```bash
cd backend
npm run benchmark:validation
```

### Dataset Generation
```bash
npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto
```

### Image Sources
- Openverse PD/CC0 (primary)
- Wikimedia Commons (fallback)
- Cached images (persistent)

---

## Post-Expansion Comparison

*To be filled after adding 15-20 new landmarks and re-running benchmark*

| Metric | Baseline (32) | Post-Expansion (50+) | Delta |
|--------|---------------|---------------------|-------|
| Median Error | 176.4 km | TBD | TBD |
| Within 100km | 43.8% | TBD | TBD |
| Within 1000km | 62.5% | TBD | TBD |
| Images | 32 | TBD | TBD |
| Geographic Coverage | 5 continents | TBD | TBD |

---

## Notes

- Synthetic benchmarks show ~8.8km median error (16x more optimistic than real images)
- Real-world accuracy is coarse regional level, not city-level
- Confidence scores currently compressed in medium tier - need empirical threshold tuning


---

## Post-Expansion Results (46 Images) - 2026-02-26

**Dataset:** 46 images from 50 landmarks (92% success rate)  
**Command:** `npm run smartblend -- --min-images=50 --seed=1337`

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total Images | 46 |
| Successful Predictions | 46 (100%) |
| Failed | 0 |
| Median Error | 222 km |
| Mean Error | 2,522 km |
| Within 100km | 39.1% |
| Within 1000km | 60.9% |
| Within 10km | 2.2% |

### Geographic Coverage (Post-Expansion)

| Continent | Count | Median Error | Within 10km |
|-----------|-------|--------------|-------------|
| Europe | 15 | 143 km | 6.7% |
| Asia | 11 | 275 km | 0% |
| North America | 8 | 2,439 km | 0% |
| South America | 5 | 72.5 km | 0% |
| **Africa** | **4** | **3,800 km** | **0%** |
| Oceania | 1 | 48.6 km | 0% |
| Unknown | 2 | 9,411 km | 0% |

**Note:** African landmarks added but show high median error (3,800 km). GeoCLIP model struggles with African geography.

---

## Pre/Post Comparison

| Metric | Baseline (32) | Post-Expansion (46) | Delta |
|--------|---------------|---------------------|-------|
| Median Error | 176.4 km | 222 km | +26% ⚠️ |
| Within 100km | 43.8% | 39.1% | -4.7pp ⚠️ |
| Within 1000km | 62.5% | 60.9% | -1.6pp ⚠️ |
| Images | 32 | 46 | +44% ✓ |
| Geographic Coverage | 5 continents | 6 continents ✓ | +Africa ✓ |

### Analysis

**Unexpected Result:** Adding 15 diverse landmarks (especially Africa) *increased* median error from 176km to 222km.

**Hypotheses:**
1. African landmarks have distinct visual features not well-represented in GeoCLIP training data
2. More diverse test set exposes model limitations more clearly
3. Original 32 images were "easier" landmarks (European/US bias in initial dataset)

**Positive Outcomes:**
- ✓ Dataset expanded from 32 → 46 images (+44%)
- ✓ African coverage: 0 → 4 images (now represented)
- ✓ Confidence tier system implemented
- ✓ 92% image acquisition success rate

---

## Confidence Threshold Analysis

Re-run on 2026-02-26 after wiring benchmark tiers to backend thresholds.

| Tier | Threshold | Count | Median Error |
|------|-----------|-------|--------------|
| High | ≥0.51 | 6 | 83.3 km |
| Medium | 0.47-0.50 | 22 | 65.4 km |
| Low | <0.47 | 18 | 3,529 km |

**Conclusion:** Tiering now separates severe outliers. Low-tier predictions are dramatically worse, while medium/high are both comparatively better and still overlap.

---

## MVP Completion Summary

### Completed Tasks

1. ✅ **Fixed Openverse API URL** - Changed from api.openverse.engineering to api.openverse.org
2. ✅ **Baseline Metrics Established** - 32 images, 176km median
3. ✅ **SmartBlend Expansion** - 35 → 50 landmarks, 46 images acquired
4. ✅ **Confidence Tiers** - Empirical thresholds (≥0.51=high, ≥0.47=medium, <0.47=low)
5. ✅ **Confidence UI** - Visual indicator with color coding in ResultsPanel
6. ✅ **Offline Map Caching** - IndexedDB tile cache with LRU eviction
7. ✅ **Documentation** - Updated knowissues.md, baseline_metrics.md

### Key Findings

- Real-world accuracy: **222km median** (coarse regional level)
- Geographic bias: Europe performs best (143km), Africa worst (3,800km)
- Confidence formula needs improvement for better error correlation
- Offline mode now functional with tile caching

### Files Modified

- `backend/src/scripts/smartblend/openverse.ts` - API URL fix
- `backend/src/scripts/smartblend/landmarks.ts` - 15 new landmarks
- `backend/src/types.ts` - Added confidence_tier
- `backend/src/config.ts` - Added CONFIDENCE_THRESHOLDS
- `backend/src/services/predictPipeline.ts` - Confidence tier calculation
- `src/lib/api.ts` - Added ConfidenceTier type
- `src/components/product/ConfidenceIndicator.tsx` - NEW
- `src/components/product/ResultsPanel.tsx` - Integrated confidence indicator
- `src/lib/tileCache.ts` - NEW
- `src/lib/offlineProtocol.ts` - NEW
- `src/components/product/mapStyles.ts` - Added offlineStyle
- `src/components/product/MapView.tsx` - Offline detection and indicator
- `docs/baseline_metrics.md` - NEW
- `knowissues.md` - Updated KI-0003, KI-0019, KI-0022
