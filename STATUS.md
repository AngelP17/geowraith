# GeoWraith Status

**Date:** 2026-03-02  
**Release Scope:** Experimental local-first geolocation with split landing/demo frontend  
**Primary Benchmark Snapshot:** 58-image validation gallery on unified GeoCLIP corpus

> **Quick Links:** [README](README.md) | [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md) | [Validation Guide](VALIDATION_GUIDE.md) | [Known Issues](knowissues.md)

---

## Executive Summary

GeoWraith is currently strong on iconic landmarks and materially better than its earlier baseline on
generic scenes, but it is not production-ready for broad visual geolocation claims.

Latest validated benchmark:

- Within 10km: **96.6%** (56/58)
- Within 1km: **91.4%**
- `iconic_landmark`: **100.0%** (22/22)
- `generic_scene`: **94.4%** (34/36)
- Remaining hard misses (>10km):
  1. Marrakech Medina
  2. Copacabana Beach

---

## Model and Retrieval Snapshot

| Mode | Status | Trigger | Notes |
|------|--------|---------|-------|
| GeoCLIP ONNX + unified corpus | Active validated path | `GEOWRAITH_USE_UNIFIED_INDEX=true` | Current best verified result (`56/58`) |
| Verifier-enabled GeoCLIP + Ollama | Available, no measured gain yet | `GEOWRAITH_ENABLE_VERIFIER=true` | Latest `qwen3.5:9b` rerun did not beat `56/58` |
| CLIP city-text fallback | Available for comparison | `GEOWRAITH_IMAGE_EMBEDDING_BACKEND=clip`, `GEOWRAITH_REFERENCE_BACKEND=clip` | Much worse on the validation set (`25.9%` within 10km) |
| Deterministic fallback | Safety path | model extraction unavailable | Very low-fidelity recovery path only |

---

## Dataset and Index Snapshot

| Artifact | Current Workspace Value |
|----------|-------------------------|
| Coordinate vectors | 54,646 (`backend/src/data/geoclipCoordinates.json`) |
| Unified reference vectors | 1,468 (`backend/.cache/geoclip/referenceVectors.v3-unified-endgame.json`) |
| Validation set | 58 images |
| Holdout seed set | 11 images |

---

## Verified Investigation Results

- A separate holdout benchmark path now exists and guards against obvious corpus leakage, but the
  current `11`-image seed set is too small to be release-grade.
- Preprocessing ablation on the two remaining failures did **not** recover them:
  `none`, `jpeg-only`, `contain-224-jpeg`, and `cover-224-jpeg` all remained wrong.
- The current `cover-224-jpeg` path is still the least-bad preprocessing option for Marrakech.
- Copacabana stays dominated by a `mapillary_TableMountain` cluster across all tested preprocessing
  modes.
- The CLIP city-text comparison profile is dramatically worse than GeoCLIP unified, so swapping to
  the current fallback model family is not a credible fix for the remaining misses.

---

## Frontend Runtime Snapshot

- `/` is the marketing-first landing page.
- `/demo` is the Mission Console for replay scenarios, live inference, map layers, anomaly cards,
  intelligence briefs, and report export.
- Replay mode remains usable when the backend is offline.
- Context layers survive style switches, and report export now generates a real QR code.

---

## Verification Commands (Latest Relevant Passes)

```bash
npm run lint
npm run build
cd backend
npm run lint
npm run test
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:holdout
GEOWRAITH_USE_UNIFIED_INDEX=true npm run investigate:failures
GEOWRAITH_USE_UNIFIED_INDEX=true npm run ablate:preprocess
npm run benchmark:compare-models -- --benchmark=validation
```

---

## Next Technical Priorities

1. Expand the holdout benchmark with more non-overlapping generic scenes.
2. Investigate Marrakech and Copacabana with stronger geo-specialized embedding options, not more
   blind corpus densification.
3. Keep verifier evaluation separate from retrieval evaluation and only claim verifier gains after a
   measured delta.
4. Continue reporting cohort split, model mode, and corpus snapshot with every benchmark claim.

---

## Claim Boundaries

- ✅ "96.6% within 10km on the current 58-image validation gallery using the unified GeoCLIP corpus"
- ✅ "100.0% iconic-landmark accuracy on the current 58-image validation gallery"
- ✅ "A separate holdout path exists and guards against obvious benchmark leakage"
- ❌ "100% benchmark accuracy" without disclosing validation-image leakage
- ❌ "The verifier currently improves the benchmark" without measured evidence
- ❌ "Production-ready universal geolocation across arbitrary scene types"
