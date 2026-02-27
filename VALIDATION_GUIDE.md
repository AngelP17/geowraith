# GeoWraith Validation Guide

**Last Updated:** 2026-02-27  
**Purpose:** Reproduce and compare real-image validation metrics consistently.

> **Quick Links:** [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md) | [STATUS](STATUS.md) | [README](README.md) | [Known Issues](knowissues.md)

---

## 1. Scope

This guide validates geolocation quality on labeled image galleries and produces a machine-readable report.

Primary benchmark command:

```bash
cd backend
npm run benchmark:validation
```

Output artifact:

- `backend/.cache/validation_gallery/benchmark_report.json`

---

## 2. Current Reference Snapshot

Current expected baseline in this workspace:

- Set size: **58 images**
- Within 10km: **93.1%** (54/58)
- Cohort split:
  - `iconic_landmark`: **100.0%**
  - `generic_scene`: **88.9%**

Known hard misses:

- Marrakech Medina
- Cape Point
- Copacabana
- Table Mountain

---

## 3. Prerequisites

1. Install dependencies:

```bash
npm install
cd backend && npm install
```

2. Ensure model mode is explicit:

- For GeoCLIP ONNX benchmark parity, verify:
  - `backend/.cache/geoclip/vision_model_q4.onnx`
  - `backend/.cache/geoclip/location_model_uint8.onnx`

If these are missing, benchmark mode will drift to CLIP fallback and results will differ.

---

## 4. Run Validation

```bash
cd backend
npm run benchmark:validation
```

Optional: inspect summarized metrics directly from JSON:

```bash
jq '.summary, .thresholds, .byCohort' .cache/validation_gallery/benchmark_report.json
```

---

## 5. Optional: Anchor Refinement Loop

For targeted improvement experiments:

```bash
cd backend
npm run refine:anchors
npm run benchmark:validation
```

Record both before/after report files and compare:

- overall within-10km
- cohort split
- per-landmark failures

---

## 6. Adding or Rebuilding Validation Gallery

If using curated datasets:

```bash
cd backend
npm run build:gallery:csv -- --images=<images_dir> --csv=<metadata_csv>
npm run benchmark:validation
```

Minimum CSV columns:

- `filename`
- `lat`
- `lon`
- `label`

---

## 7. Reporting Rules

Every reported result should include:

- date/time (UTC)
- model mode (GeoCLIP ONNX / CLIP fallback)
- gallery size
- within-10km aggregate
- cohort split
- unresolved hard failures

Do not publish a single blended score without cohort context.

---

## 8. Troubleshooting

- Benchmark unexpectedly slow on first image:
  - Expected during model/index warmup
- Sudden metric drop:
  - verify model files present and index cache consistency
- Inconsistent results across machines:
  - compare `benchmark_report.json` and model mode first

