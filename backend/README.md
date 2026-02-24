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
- GeoCLIP assets expected in `.cache/geoclip/`:
  - `vision_model_uint8.onnx`
  - `location_model_uint8.onnx`
  - `coordinates_100K.json`

## Current Limitations

- Reference dataset: 50,000 sampled coordinates target (improved coverage, still incomplete for production-grade claims)
- Accuracy target: Meter-level (not yet validated on real imagery)
- Confidence scores: Not yet calibrated to real-world error distributions

## Runtime Diagnostics

`POST /api/predict` now includes:
- `status`: `ok` or `low_confidence`
- `diagnostics.embedding_source`: `geoclip` or `fallback`
- `diagnostics.reference_index_source`: `model`, `cache`, `fallback`, or `unknown`
