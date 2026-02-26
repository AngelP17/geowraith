# GeoWraith Backend (MVP — Work in Progress)

This backend implements a deterministic, local-first GeoCLIP pipeline for experimental visual geolocation:

- Input validation (`image_base64` or data URL)
- GeoCLIP vision embedding extraction (ONNX local runtime)
- Local vector search over GeoCLIP reference records
- Coordinate aggregation with confidence and radius output
- EXIF GPS passthrough when geotags exist

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:8080`.

## Commands

```bash
npm run lint
npm run build
npm run test
npm run benchmark:accuracy
npm run build:dataset
npm run build:gallery
npm run build:gallery:local
npm run build:gallery:csv
npm run build:gallery:real
npm run benchmark:validation
```

## Endpoints

- `GET /health`
- `POST /api/predict`

API contract: `backend/docs/openapi.yaml`

## Important Notes

- **Experimental/WIP**: This is an MVP implementation. Real-world accuracy is unvalidated.
- No external API calls are used.
- Remote `image_url` fetches are intentionally blocked for local-first behavior.
- **Accuracy limitations**: Synthetic benchmarks do not guarantee real-world performance. The 50,000 reference target improves coverage but is still not a substitute for labeled real-image validation.
- `benchmark:accuracy` uses synthetic perturbations; real-world labeled-image validation is pending.
- `build:gallery:local` generates a tiny local sample gallery for pipeline checks only (not real-world accuracy).
- `build:gallery:csv` builds a validation gallery from local photos + CSV metadata (recommended).
- `build:gallery:real` downloads a small landmark set from Wikimedia (rate-limited; try `--dry-run` first).
- GeoCLIP assets expected in `.cache/geoclip/`:
  - `vision_model_q4.onnx`
  - `location_model_uint8.onnx`
  - `coordinates_100K.json`

## Current Limitations

- Reference dataset: 50,000 sampled coordinates target (improved coverage, still incomplete for production-grade claims)
- Accuracy target: Meter-level (not yet validated on real imagery)
- Confidence scores: Not yet calibrated to real-world error distributions

## Runtime Diagnostics

`POST /api/predict` now includes:
- `status`: `ok` or `low_confidence`
- `location_visibility`: `visible` or `withheld`
- `location_reason`: why location was withheld (`model_fallback_active`, `candidate_spread_too_wide`, `confidence_below_actionable_threshold`)
- `diagnostics.embedding_source`: `geoclip` or `fallback`
- `diagnostics.reference_index_source`: `model`, `cache`, `fallback`, or `unknown`

When confidence is below the actionable threshold, GeoWraith returns `low_confidence` and withholds coordinate display to avoid hard false positives (for example, wrong continent predictions on weak matches).
