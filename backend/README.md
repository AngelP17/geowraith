# GeoWraith Backend

**Version:** 0.2.0  
**Last Updated:** 2026-03-02

> **Quick Links:** [Main README](../README.md) | [Status](../STATUS.md) | [Architecture](../ARCHITECTURE.md) | [Validation Guide](../VALIDATION_GUIDE.md) | [Reproducibility Playbook](../docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## What This Service Does

`backend` provides local image geolocation inference via:

- EXIF GPS passthrough
- configurable image preprocessing before embedding
- GeoCLIP ONNX embeddings (preferred validated path)
- CLIP fallback and deterministic fallback paths for controlled comparisons and recovery
- HNSW retrieval over unified reference vectors
- confidence calibration and coordinate withholding
- optional verifier, intelligence brief, anomaly detection, and health/metrics endpoints

---

## Commands

```bash
cd backend

npm run dev
npm run lint
npm run build
npm run test

npm run benchmark:validation
npm run benchmark:holdout
npm run investigate:failures
npm run ablate:preprocess
npm run benchmark:compare-models -- --benchmark=validation
```

---

## API Endpoints

- `GET /health`
- `GET /ready`
- `GET /live`
- `GET /metrics`
- `POST /api/predict`
- `POST /api/predict/sfm` (feature-gated)

Contract:

- `backend/docs/openapi.yaml`

---

## Current Validation Snapshot

From the clean 58-image validation gallery:

- Within 10km: **96.6%** (56/58)
- Within 1km: **91.4%**
- `iconic_landmark`: **100.0%**
- `generic_scene`: **94.4%**
- Remaining hard misses: Marrakech Medina and Copacabana Beach

The current verifier-enabled rerun with `qwen3.5:9b` did not beat this result.

For exact reproduction steps:

- [../docs/REPRODUCIBILITY_PLAYBOOK.md](../docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## Runtime Notes

- `GEOWRAITH_USE_UNIFIED_INDEX=true` is the current best validated path.
- `GEOWRAITH_IMAGE_PREPROCESS_MODE` supports `none`, `jpeg-only`, `contain-224-jpeg`, and `cover-224-jpeg`.
- `GEOWRAITH_IMAGE_EMBEDDING_BACKEND` and `GEOWRAITH_REFERENCE_BACKEND` are intended for controlled
  benchmarking and failure analysis.
- If GeoCLIP ONNX model files are missing, backend falls back to CLIP mode.
- Do not mix validation and holdout results in one headline claim.
