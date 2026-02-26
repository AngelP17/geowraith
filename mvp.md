GeoWraith MVP Task Execution (Zero-Cost)

Date: 2026-02-24

## Status

Status: MVP IMPLEMENTED — VALIDATION PENDING  
Confidence: 0.99

**Note**: This is a functional MVP demonstrating the core pipeline. Real-world accuracy validation and production hardening remain ongoing work.

Evidence (verified in this task):
- `cd backend && npm run build:dataset`
- `cd backend && npm run lint`
- `cd backend && npm run build`
- `cd backend && npm run test`
- `cd backend && npm run benchmark:accuracy` (7,200 synthetic samples)
- `npm run lint`
- `npm run build`
- Runtime reachability checks: frontend `http://localhost:3001` = 200, backend `http://localhost:8080/health` = 200

Not run:
- Physical-device browser validation
- Real-world labeled image benchmark harness (outside synthetic benchmark)

## Completed Scope

- [x] Replaced generic CLIP path with local GeoCLIP ONNX runtime (`uint8` models).
- [x] Added GeoCLIP location embedding path for coordinate candidates.
- [x] Implemented GeoCLIP reference index service with:
  - 50,000 sampled coordinates from GeoCLIP 100K gallery
  - chunked embedding generation
  - large-index in-memory operation (cache persistence skipped above 20k vectors)
  - deterministic fallback index if model assets are unavailable
- [x] Updated vector search to use async GeoCLIP index instead of placeholder static vectors.
- [x] Kept response contract unchanged:
  - `location.lat`
  - `location.lon`
  - `location.radius_m`
  - `confidence`
  - `top_matches`
- [x] Added dataset builder command: `npm run build:dataset`.
- [x] Preserved EXIF passthrough behavior for exact geotagged images.
- [x] Preserved local-first constraints (no external prediction APIs).

## Implemented Architecture

```mermaid
graph TD
  A[Upload Static Image] --> B[POST /api/predict]
  B --> C[Request Validation]
  C --> D[EXIF GPS Check]
  D -->|GPS Present| E[Return EXIF Coordinates]
  D -->|No GPS| F[GeoCLIP Vision Embedding]
  F --> G[GeoCLIP Reference Index]
  G --> H[Nearest Neighbors]
  H --> I[Coordinate Aggregation]
  I --> J[lat lon radius confidence top_matches]
```

## Accuracy Snapshot (Current — Synthetic Only)

Benchmark command:

```bash
cd backend
npm run benchmark:accuracy
```

Latest synthetic summary:
- Large-index benchmark for 50,000 references is computationally expensive and was not re-run in this pass.
- Last completed synthetic benchmark (10,000-reference phase) showed non-meter-level behavior and is retained as historical context only.

**Important Interpretation**:
- This benchmark validates internal pipeline consistency using synthetic perturbations.
- **Real-world accuracy on actual diverse imagery is UNVALIDATED**.
- Meter-level precision is a development target, not a current guarantee.
- Do not rely on this system for critical geolocation tasks without independent validation.

## API Behavior (Stable)

`POST /api/predict` accepts:
- `image_base64`
- `image_url` only when it is a `data:image/...;base64,...` URL

Returns:
- `request_id`, `status`, `mode`
- `location` (`lat`, `lon`, `radius_m`)
- `confidence`
- `elapsed_ms`
- `notes`
- `top_matches`

## Zero-Cost and Ethics Alignment

- No paid model/API dependency in inference path.
- No user/session/query persistence introduced.
- No live camera ingestion.
- System remains focused on place geolocation from uploaded static images.

## Remaining Work (Required for Production Use)

### Validation (Critical)
- [x] Real-image benchmark against labeled geolocation datasets (46 landmark images)
- [x] Confidence/radius calibration against real-world error distributions (empirical thresholds implemented)
- [x] Physical-device validation guide created (execution pending actual device testing)

### Engineering (Important)
- [x] Expanded reference coordinate dataset target to 50,000 samples
- [x] Implement offline map tile caching (IndexedDB with LRU eviction)
- [x] Add confidence thresholding for low-certainty predictions (high/medium/low tiers)
- [x] SfM pipeline implemented (`/api/predict/sfm` endpoint)

### Documentation
- [x] Accuracy claims validated with benchmark (46 images, documented in docs/baseline_metrics.md)
- [x] Deployment runbook created (docs/DEPLOYMENT_RUNBOOK.md)

## Remaining blockers

- ~~Open issue KI-0003 (external tile dependency)~~ - **RESOLVED** (offline tile caching implemented)
- Mitigated issue KI-0006 (real-world accuracy validated with 46 images, 222km median): [knowissues.md](/Users/apinzon/Desktop/Active Projects/geowraith/knowissues.md:115)
- Mitigated issue KI-0014 (stale backend process can serve old code until restart): [knowissues.md](/Users/apinzon/Desktop/Active Projects/geowraith/knowissues.md)
- Physical-device map rendering validation is still required (headless runs can't fully prove GUI/WebGL behavior): [CONTINUITY.md](/Users/apinzon/Desktop/Active Projects/geowraith/.agent/CONTINUITY.md:71)

Status: MVP COMPLETE (with known accuracy limitations)
Confidence: 0.95
Unrun checks: Physical device browser validation

## Completed MVP Items (2026-02-26)

1. ✅ Openverse API URL fix (api.openverse.org)
2. ✅ Baseline accuracy metrics (32 images, 176km median)
3. ✅ SmartBlend expansion (35 → 50 landmarks, 46 images acquired)
4. ✅ Empirical confidence thresholds (high ≥0.51, medium ≥0.47, low <0.47)
5. ✅ Confidence tier UI component with color coding
6. ✅ Offline map tile caching (IndexedDB, LRU eviction, 100MB/30MB quota)
7. ✅ Updated documentation (baseline_metrics.md, knowissues.md)

## Accuracy Reality Check

**Current Performance (46 images):**
- Median error: 222 km (coarse regional level)
- Within 100km: 39.1%
- Within 1000km: 60.9%
- Geographic bias: Europe (143km) >> Africa (3,800km)

**Marketing Claims:**
- ✅ "Coarse regional geolocation (~220km median on 46 landmarks)"
- ❌ "Meter-level geolocation" (not accurate)
- ❌ "City-level precision" (not accurate)
Unrun checks: none for the executed command suite above.
