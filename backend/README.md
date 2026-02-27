# GeoWraith Backend

**Version:** 0.2.0  
**Last Updated:** 2026-02-27

> **Quick Links:** [Main README](../README.md) | [Status](../STATUS.md) | [Architecture](../ARCHITECTURE.md) | [Validation Guide](../VALIDATION_GUIDE.md) | [Reproducibility Playbook](../docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## What This Service Does

`backend` provides local image geolocation inference via:

- EXIF GPS passthrough
- GeoCLIP ONNX embeddings (preferred)
- CLIP text-matching fallback
- deterministic fallback safety path
- ANN/HNSW search over coordinate vectors + image anchors
- confidence tiering and coordinate withholding

---

## Commands

```bash
cd backend

npm run dev
npm run lint
npm run build
npm run test

npm run benchmark:validation
npm run benchmark:accuracy
npm run benchmark:search
```

---

## API Endpoints

- `GET /health`
- `POST /api/predict`
- `POST /api/predict/sfm` (feature-gated)

Contract:

- `backend/docs/openapi.yaml`

---

## Current Validation Snapshot

From the active 58-image gallery benchmark:

- Within 10km: **93.1%** (54/58)
- `iconic_landmark`: **100.0%**
- `generic_scene`: **88.9%**

For exact reproduction steps:

- [../docs/REPRODUCIBILITY_PLAYBOOK.md](../docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## Runtime Notes

- If GeoCLIP ONNX model files are missing, backend falls back to CLIP mode.
- Model mode must be recorded with any published benchmark result.
- Low-confidence predictions can return withheld coordinates by design.

