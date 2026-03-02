# GeoWraith Validation Guide

**Last Updated:** 2026-03-02  
**Purpose:** Reproduce and compare validation, holdout, and failure-analysis results consistently.

> **Quick Links:** [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md) | [STATUS](STATUS.md) | [README](README.md) | [Known Issues](knowissues.md)

---

## 1. Scope

This guide validates geolocation quality on labeled image galleries and produces machine-readable
reports.

Primary benchmark command:

```bash
cd backend
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation
```

Primary output artifact:

- `backend/.cache/validation_gallery/benchmark_report.json`

---

## 2. Current Reference Snapshot

Current expected clean baseline in this workspace:

- Set size: **58 images**
- Within 10km: **96.6%** (56/58)
- Within 1km: **91.4%**
- Cohort split:
  - `iconic_landmark`: **100.0%**
  - `generic_scene`: **94.4%**

Known hard misses:

- Marrakech Medina
- Copacabana Beach

The current seed holdout set is separate and uncontaminated, but at `17` images it is still too
  small to replace the main validation benchmark in release claims.

---

## 3. Prerequisites

1. Install dependencies:

```bash
npm install
cd backend && npm install
```

2. Ensure model mode is explicit:

- for GeoCLIP parity, verify:
  - `backend/.cache/geoclip/vision_model_q4.onnx`
  - `backend/.cache/geoclip/location_model_uint8.onnx`

If these are missing, benchmark mode will drift to CLIP or deterministic fallback and the results
will differ.

---

## 4. Run Validation

```bash
cd backend
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:validation
```

Optional: inspect summarized metrics directly from JSON:

```bash
jq '.summary, .thresholds, .byCohort' .cache/validation_gallery/benchmark_report.json
```

---

## 5. Run Holdout and Failure Investigation

```bash
cd backend
npm run build:gallery:holdout
GEOWRAITH_USE_UNIFIED_INDEX=true npm run benchmark:holdout
GEOWRAITH_USE_UNIFIED_INDEX=true npm run investigate:failures
GEOWRAITH_USE_UNIFIED_INDEX=true npm run ablate:preprocess
```

Artifacts:

- `.cache/holdout_gallery/benchmark_report.json`
- `.cache/geoclip/hard_failure_investigation.json`
- `.cache/geoclip/preprocessing_ablation.json`

---

## 6. Compare Embedding/Reference Profiles

```bash
cd backend
npm run benchmark:compare-models -- --benchmark=validation
```

Current verified outcome:

- `geoclip-unified` is the best validated profile
- `clip-city` is dramatically worse on the same gallery and should not be used as a drop-in
  replacement

---

## 7. Reporting Rules

Every reported result should include:

- date/time (UTC)
- benchmark set name and size
- model mode (`geoclip`, `clip`, or fallback)
- corpus mode (`unified`, `osv`, or standard)
- within-10km aggregate
- cohort split
- unresolved hard failures

Do not:

- publish a single blended score without cohort context
- claim verifier gains without a measured delta
- claim holdout parity from the current `17`-image seed alone

---

## 8. Troubleshooting

- Benchmark unexpectedly slow on first image:
  - expected during model or index warmup
- Sudden metric drop:
  - verify GeoCLIP model files, benchmark set, and corpus flags first
- Suspiciously perfect results:
  - check for benchmark leakage before trusting the number
- Hard-scene behavior changes across preprocessing modes:
  - compare `.cache/geoclip/preprocessing_ablation.json` rather than relying on anecdotal single runs
