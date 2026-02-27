# GeoWraith Reproducibility Playbook

**Last Updated:** 2026-02-27  
**Goal:** Reproduce the latest validated benchmark behavior on another machine.

> **Canonical References:** [README](../README.md) | [STATUS](../STATUS.md) | [ARCHITECTURE](../ARCHITECTURE.md) | [VALIDATION_GUIDE](../VALIDATION_GUIDE.md) | [Known Issues](../knowissues.md)

---

## 1. Snapshot You Are Reproducing

This playbook targets the current validation snapshot in this workspace:

- Validation gallery: **58 images**
- Benchmark: `npm run benchmark:validation`
- Within 10km: **93.1%** (54/58)
- Cohorts:
  - `iconic_landmark`: **100.0%** (22/22)
  - `generic_scene`: **88.9%** (32/36)
- Remaining hard failures (>10km):
  - Marrakech Medina
  - Cape Point
  - Copacabana
  - Table Mountain

Evidence artifact:

- `backend/.cache/validation_gallery/benchmark_report.json`

---

## 2. Models Used

GeoWraith uses a tiered inference strategy:

1. **GeoCLIP ONNX (preferred)**
- `backend/.cache/geoclip/vision_model_q4.onnx`
- `backend/.cache/geoclip/location_model_uint8.onnx`

2. **CLIP text-matching fallback** (`@xenova/transformers`)
- Model: `Xenova/clip-vit-base-patch32`
- Used when GeoCLIP ONNX files are missing

3. **Deterministic feature fallback**
- Used only when both model paths fail

If ONNX models are missing, you should **not** expect the same benchmark numbers as this snapshot.

---

## 3. Dataset and Index Components

For the current validated setup:

- Coordinate catalog: `backend/src/data/geoclipCoordinates.json` (**54,646** points)
- Image anchors cache: `backend/.cache/geoclip/referenceImageVectors.merged_v1.json` (**1,081** vectors)
- Combined ANN index cache:
  - `backend/.cache/geoclip/hnsw_index.merged_v1.bin`

Validation set:

- Images + metadata:
  - `backend/.cache/validation_gallery/images/`
  - `backend/.cache/validation_gallery/manifest.json`

---

## 4. What Worked vs. What Did Not

### Worked

- Rank-aware continent voting + top-match locking
- Targeted anchor refinement for hard landmarks
- Cohort split reporting (iconic vs generic) for transparent quality tracking
- Confidence withholding for uncertain outputs

### Did Not Produce Additional Gains

- Simple confuser cap (`Sagrada Familia` / `Great Barrier Reef` 30 -> 10) did not beat 93.1%
- Large Mapillary street-level ingestion did not resolve the same 4 generic-scene failures
- Strict Wikimedia-only rebuild was unstable under throttling and required rollback safety

---

## 5. Reproduce on a Fresh Machine

## 5.1 Prerequisites

- Node.js 20+
- npm 10+
- macOS/Linux shell

## 5.2 Install

```bash
# repo root
npm install

cd backend
npm install
```

If your environment fails on `onnxruntime-node` postinstall, use the fallback workflow in [AGENTS.md](../AGENTS.md) under "Backend npm install workaround".

## 5.3 Validate model files

```bash
ls backend/.cache/geoclip/vision_model_q4.onnx
ls backend/.cache/geoclip/location_model_uint8.onnx
```

If missing, acquire them before reproducing GeoCLIP-based numbers.

## 5.4 Run benchmark

```bash
cd backend
npm run benchmark:validation
```

## 5.5 Confirm output

You should see approximately:

- `Within 10km: 93.1%`
- `Iconic Landmark: 100.0%`
- `Generic Scene: 88.9%`

And report file:

```bash
backend/.cache/validation_gallery/benchmark_report.json
```

---

## 6. Regenerate / Rebuild Workflow (Optional)

Use when reproducing from raw inputs or experimenting:

```bash
cd backend

# re-run validation
npm run benchmark:validation
```

If you are changing validation inputs:

```bash
npm run build:gallery:csv -- --images=<path> --csv=<metadata.csv>
npm run benchmark:validation
```

---

## 7. Determinism and Drift Controls

- Keep `package-lock.json` committed and unchanged across runs
- Record exact command set used
- Store `benchmark_report.json` artifact per run
- Avoid mixing fallback mode results with GeoCLIP ONNX results in one headline claim
- Always report cohort split alongside aggregate score

---

## 8. Reporting Template

When sharing results, include:

- Date/time (UTC)
- Model mode (GeoCLIP ONNX or CLIP fallback)
- Validation set size
- Within-10km aggregate
- Cohort split (`iconic_landmark`, `generic_scene`)
- Known hard failures list
