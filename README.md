# GeoWraith v2.2

Local-first visual geolocation with explicit confidence gating and reproducible validation.

> **Quick Links:** [Status](STATUS.md) | [Architecture](ARCHITECTURE.md) | [Validation Guide](VALIDATION_GUIDE.md) | [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md) | [Known Issues](knowissues.md)

---

## What GeoWraith Is

GeoWraith is an experimental geolocation system that predicts coordinates from images using a local pipeline:

- EXIF passthrough when image GPS metadata exists
- GeoCLIP ONNX embeddings (preferred)
- CLIP text-matching fallback if ONNX files are unavailable
- Deterministic fallback if model paths fail
- ANN/HNSW retrieval over coordinate vectors plus image anchors
- Confidence and match-consensus gating with location withholding for uncertain results

Inference is local-first and does not require paid APIs.

---

## Current Verified Snapshot (2026-02-27)

From `backend/.cache/validation_gallery/benchmark_report.json`:

- Validation set: **58 images**
- Within 10km: **93.1%** (54/58)
- Cohorts:
  - `iconic_landmark`: **100.0%** (22/22)
  - `generic_scene`: **88.9%** (32/36)

Remaining hard failures (generic scenes): Marrakech, Cape Point, Copacabana, Table Mountain.

Important: these numbers are tied to the current GeoCLIP + anchor corpus in this workspace. Do not generalize without running your own benchmark.

---

## Models

GeoWraith supports three inference tiers:

1. **GeoCLIP ONNX**
- `backend/.cache/geoclip/vision_model_q4.onnx`
- `backend/.cache/geoclip/location_model_uint8.onnx`

2. **CLIP fallback** (`@xenova/transformers`)
- Auto-downloads `Xenova/clip-vit-base-patch32`
- Used when GeoCLIP ONNX files are missing

3. **Deterministic fallback**
- Last-resort path when model extraction fails

---

## Runtime Notes

- Product map uses a fixed-height viewport so the basemap does not collapse into a black pane.
- Standard, Satellite, and 3D style switches use a guarded completion path so stalled
  `style.load` events do not leave the map stuck between modes.
- Operator-safe mode keeps the basemap visible while withheld coordinates remain hidden.
- EXIF GPS extraction only runs when the uploaded image actually contains EXIF metadata, so
  valid WebP/GIF uploads no longer spam backend logs with `Unknown file format` warnings.

---

## Quick Start

```bash
# repo root
npm install

# backend
cd backend
npm install

# run backend
npm run dev

# run frontend (new terminal, repo root)
cd ..
npm run dev
```

Frontend: `http://localhost:3001`  
Backend health: `http://localhost:8080/health`

### Start Both Services Together

```bash
# repo root
npm run start
```

`start.sh` now defaults to backend `npm run dev` (TypeScript runtime), reuses already-running services on
`3001`/`8080`, and waits through model/index warmup before failing health checks.

Optional overrides:

```bash
BACKEND_START_CMD="npm run dev:watch" npm run start
BACKEND_STARTUP_RETRIES=360 STARTUP_POLL_SECONDS=0.5 npm run start
```

---

## Reproduce Latest Validation Result

```bash
cd backend
npm run benchmark:validation
```

See full reproducibility instructions in:

- [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## Core Commands

### Frontend (repo root)

```bash
npm run dev
npm run lint
npm run build
```

### Backend (`backend/`)

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run benchmark:validation
```

---

## Accuracy and Claims Policy

- Always report **model mode** (GeoCLIP ONNX vs CLIP fallback)
- Always report **validation set size**
- Always report **cohort split** (`iconic_landmark` vs `generic_scene`)
- Do not claim meter-level precision from aggregate benchmarks alone

---

## Ethics and Responsible Use

GeoWraith is intended for authorized and lawful use only. Operators are responsible for legal and ethical compliance in their jurisdiction.

---

## License

MIT
