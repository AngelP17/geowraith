# GeoWraith Reproducibility Playbook

**Last Updated:** 2026-03-02  
**Goal:** Reproduce the current clean benchmark behavior on another machine without contaminating the corpus.

> **Canonical References:** [README](../README.md) | [STATUS](../STATUS.md) | [ARCHITECTURE](../ARCHITECTURE.md) | [VALIDATION_GUIDE](../VALIDATION_GUIDE.md) | [Known Issues](../knowissues.md)

---

## 1. Snapshot You Are Reproducing

This playbook targets the current clean validation snapshot in this workspace:

- Validation gallery: **58 images**
- Benchmark: `GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation`
- Within 10km: **96.6%** (56/58)
- Within 1km: **91.4%**
- Cohorts:
  - `iconic_landmark`: **100.0%** (22/22)
  - `generic_scene`: **94.4%** (34/36)
- Remaining hard failures:
  - Marrakech Medina
  - Copacabana Beach

Evidence artifact:

- `backend/.cache/validation_gallery/benchmark_report.json`

---

## 2. Models Used

GeoWraith uses a tiered strategy:

1. **GeoCLIP ONNX (preferred)**
   - `backend/.cache/geoclip/vision_model_q4.onnx`
   - `backend/.cache/geoclip/location_model_uint8.onnx`
2. **CLIP fallback**
   - explicit comparison or missing GeoCLIP assets
3. **Deterministic fallback**
   - last-resort recovery only

If ONNX models are missing, you should **not** expect the same benchmark numbers as this snapshot.

---

## 3. Dataset and Index Components

For the current validated setup:

- Coordinate catalog:
  - `backend/src/data/geoclipCoordinates.json` (`54,646` points)
- Unified reference corpus:
  - `backend/.cache/geoclip/referenceVectors.v3-unified-endgame.json` (`1,468` vectors)
- Unified HNSW index:
  - `backend/.cache/geoclip/hnsw_index.v3-unified-endgame.bin`

Validation set:

- `backend/.cache/validation_gallery/images/`
- `backend/.cache/validation_gallery/manifest.json`

Holdout seed set:

- `backend/.cache/holdout_gallery/images/`
- `backend/.cache/holdout_gallery/manifest.json`

---

## 4. Leakage Controls

Do not reproduce with:

- benchmark-derived anchors in the runtime corpus
- validation images copied into `referenceImageVectors.*`
- “perfect” results that were achieved by adding `validation_*` assets to the index

The runner now guards against obvious benchmark-prefix leakage:

- `backend/src/benchmarks/validationBenchmark/leakage.ts`

This does not replace careful corpus hygiene. It just catches the most obvious mistakes.

---

## 5. Fresh-Machine Reproduction

### 5.1 Install

```bash
npm install

cd backend
npm install
```

### 5.2 Validate model files

```bash
ls backend/.cache/geoclip/vision_model_q4.onnx
ls backend/.cache/geoclip/location_model_uint8.onnx
```

### 5.3 Run the clean validation benchmark

```bash
cd backend
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation
```

### 5.4 Confirm output

You should see approximately:

- `Within 10km: 96.6%`
- `Within 1km: 91.4%`
- `Iconic Landmark: 100.0%`
- `Generic Scene: 94.4%`

---

## 6. Investigation Workflows

### Holdout

```bash
cd backend
npm run build:gallery:holdout
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:holdout
```

### Hard-failure investigation

```bash
cd backend
GEOWRAITH_USE_UNIFIED_INDEX=true npm run investigate:failures
GEOWRAITH_USE_UNIFIED_INDEX=true npm run ablate:preprocess
```

### Model-profile comparison

```bash
cd backend
npm run benchmark:compare-models -- --benchmark=validation
```

Current verified conclusion:

- `clip-city` is materially worse than `geoclip-unified`

---

## 7. Determinism and Drift Controls

- keep `package-lock.json` committed and unchanged across runs
- record exact env flags used
- store `benchmark_report.json` per run
- report model mode and corpus mode with every claim
- do not mix holdout and validation numbers in one headline

---

## 8. Reporting Template

When sharing results, include:

- date/time (UTC)
- model mode
- corpus mode
- benchmark set size
- within-10km aggregate
- cohort split
- hard-failure list
- whether verifier was enabled and whether it changed the result
