# GeoWraith Status

**Date:** 2026-02-27  
**Release Scope:** Stable local-first geolocation pipeline  
**Primary Benchmark Snapshot:** 58-image validation gallery

> **Quick Links:** [README](README.md) | [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md) | [Validation Guide](VALIDATION_GUIDE.md) | [Known Issues](knowissues.md)

---

## Executive Summary

GeoWraith is currently strongest on iconic landmarks and weaker on generic scenes with cross-region visual ambiguity.

Latest validated benchmark:

- Within 10km: **93.1%** (54/58)
- `iconic_landmark`: **100.0%** (22/22)
- `generic_scene`: **88.9%** (32/36)

Current blocking misses (>10km):

1. Marrakech Medina
2. Cape Point
3. Copacabana
4. Table Mountain

---

## Model/Inference Modes

| Mode | Status | Trigger | Notes |
|------|--------|---------|-------|
| GeoCLIP ONNX | Active when model files exist | `vision_model_q4.onnx` + `location_model_uint8.onnx` present | Preferred path for benchmark reproduction |
| CLIP fallback | Active when ONNX missing | Auto-downloads `Xenova/clip-vit-base-patch32` | Lower reliability for city-level and generic scenes |
| Deterministic fallback | Safety path | Both model paths unavailable | Very low fidelity fallback |

---

## Dataset and Index Snapshot

| Artifact | Current Workspace Value |
|----------|-------------------------|
| Coordinate vectors | 54,646 (`backend/src/data/geoclipCoordinates.json`) |
| Image anchors | 1,081 (`referenceImageVectors.merged_v1.json`) |
| Combined index | 55,727 vectors (during validation run) |
| Validation set | 58 images |

---

## Frontend Runtime Snapshot

- Fixed-height map viewport prevents the black/empty map pane regression.
- Standard, Satellite, and 3D transitions are guarded by a `style.load` timeout fallback.
- Operator-safe mode keeps the basemap visible while withholding low-confidence targets.
- Valid non-EXIF uploads (for example WebP screenshots) no longer generate repeated EXIF
  parser warnings in backend logs.

---

## What Improved Results

- Rank-aware continent voting and top-match lock
- Targeted anchor refinement
- Cohort split reporting to expose generic-scene weakness directly

## What Did Not Improve the Ceiling

- Reducing Barcelona confuser anchor cap (no net gain)
- Mapillary-heavy anchor densification alone
- Strict Wikimedia rebuild under throttling conditions

---

## Verification Commands (Latest Pass)

```bash
npm run lint
npm run build
cd backend
npm run lint
npm run test
npm run benchmark:validation
```

---

## Next Technical Priorities

1. Expand hard-negative anchors for the 4 remaining failure classes
2. Add holdout/OOD validation set (non-overlapping with anchor corpus)
3. Improve generic-scene disambiguation (model + retrieval strategy)
4. Keep reporting with cohort split and explicit model mode

---

## Claim Boundaries

- ✅ "Strong landmark geolocation with local-first operation"
- ✅ "93.1% within 10km on current 58-image benchmark"
- ❌ "Universal 95%+ across all scene types"
- ❌ "Meter-level for arbitrary single photos"
