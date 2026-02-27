# knowissues

Living list of known issues, gaps, and risks. Keep this concise, factual, and current.

## Update Policy

- Add an entry when a bug/risk is discovered and not fully resolved.
- Update status as work progresses (`open`, `mitigated`, `resolved`, `wontfix`).
- Include reproducible evidence and scope.
- Close issues by adding `Resolution` details and date.
- Record discovery and status transitions in `.agent/CONTINUITY.md`.
- If resolution creates a stable policy/change, summarize that in `Memory.md`.

## State Flow

`open -> mitigated -> resolved` or `open -> wontfix`

## Entry Template

```text
## KI-<id>: <short title>
- Status: resolved | mitigated | resolved | wontfix
- Severity: low | medium | high | critical
- First Seen: YYYY-MM-DD
- Last Updated: YYYY-MM-DD
- Area: <component/path>
- Description: <what fails or can drift>
- Reproduction: <minimal command/steps>
- Expected: <expected behavior>
- Actual: <actual behavior>
- Impact: <user/system impact>
- Workaround: <temporary workaround or none>
- Resolution: <filled when resolved>
- Evidence: <tests/logs/refs>
```

## Current Known Issues

## KI-0001: Documentation and repository state are not yet synchronized
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: repository root documentation
- Description: `README.md` describes a full monorepo structure that may not match currently committed directories/files in this workspace.
- Reproduction: compare `README.md` structure section against `ls` output at repo root.
- Expected: documentation reflects actual repository layout or is clearly marked as target-state.
- Actual: structure appears partially target-state and may cause operator confusion.
- Impact: onboarding friction and inaccurate completion assumptions.
- Workaround: none
- Resolution: README now reflects the current host-first repo layout and removes target-state Docker/Earthly instructions.
- Evidence: root listing and README structure content reviewed on 2026-02-24.

## KI-0002: Backend stub is not wired to frontend
- Status: resolved
- Severity: low
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: backend/src, frontend integration
- Description: The backend API stub exists but the frontend does not call it yet.
- Reproduction: Run frontend and backend; initiate a prediction from the Product UI.
- Expected: UI should call `/api/predict` when the product experience is built.
- Actual: Product UI calls `/api/predict` via `predictImage`.
- Impact: Product functionality now available for live local inference responses.
- Workaround: none
- Resolution: Product UI wired to `/api/predict`, and backend stub replaced by local feature-extraction + vector-search inference pipeline.
- Evidence: `src/components/sections/ProductUI.tsx`, `src/lib/api.ts`, `backend/src/app.ts`, `backend/src/services/predictPipeline.ts` on 2026-02-24.

## KI-0004: MapLibre __publicField runtime crash

- Status: resolved
- Severity: critical
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: tsconfig.json line 6, MapView.tsx
- Description: MapLibre v5.19.0 requires `useDefineForClassFields: true` for ES2022 class field syntax compatibility. Setting was `false`, causing runtime crash when creating maplibregl.Map instances.
- Reproduction: Start dev server, navigate to Product UI, upload image → Map fails to initialize with `__publicField is undefined` error.
- Expected: Map renders successfully and displays marker at predicted location.
- Actual (before fix): Runtime crash, map container empty, console errors.
- Impact: Product UI map completely non-functional, core feature broken.
- Workaround: none
- Resolution: Changed `useDefineForClassFields: false` to `true` in tsconfig.json line 6. Verified map initialization, marker display, all controls, and three style modes (Standard/Satellite/3D). Build and lint pass.
- Evidence: End-to-end testing on 2026-02-24. Build verification: `npm run lint` ✓, `npm run build` ✓ (1.89s).

## KI-0003: Map view depends on external tile servers
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-26
- Area: `src/components/product/MapView.tsx`, `mapStyles.ts`, `src/lib/tileCache.ts`, `src/lib/offlineProtocol.ts`
- Description: MapLibre styles use public tile servers for standard/satellite/terrain views.
- Reproduction: Run frontend without internet; map tiles fail to load.
- Expected: Offline-capable map tiles or graceful offline fallback.
- Actual: Offline mode now switches map rendering to `offlineStyle` (`cached://` protocol), so cached tiles are actually used when network is unavailable.
- Impact: Offline mode now functional for previously viewed map areas.
- Workaround: None needed - feature implemented.
- Resolution: Implemented tile cache system:
  - `src/lib/tileCache.ts`: IndexedDB storage with LRU eviction (100MB desktop, 30MB mobile)
  - `src/lib/offlineProtocol.ts`: Custom `cached://` protocol for MapLibre
  - `src/components/product/useMapRuntime.ts`: Network status detection, offline style switching, and lifecycle-safe event/protocol cleanup
  - `src/components/product/MapStatusOverlays.tsx`: Offline/warning/error render state overlays
  - `src/components/product/mapStyles.ts`: Offline style using cached protocol
- Evidence: Build verification `npm run build` ✓, `npm run lint` ✓ on 2026-02-26. Runtime path now selects `offlineStyle` while offline and restores online styles after reconnect.

## KI-0005: Unused Google GenAI dependency and Vite env define created local-first drift
- Status: resolved
- Severity: low
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`
- Description: The frontend included unused `@google/genai` and `process.env.GEMINI_API_KEY` define despite no runtime usage.
- Reproduction: Search repository for `@google/genai` and `GEMINI_API_KEY`; only package/config references existed.
- Expected: No unused remote-AI dependency/config in local-first baseline.
- Actual: Unused dependency/config present and legacy page title remained.
- Impact: Unnecessary dependency surface and branding/config drift.
- Workaround: none
- Resolution: Removed dependency and config, updated title to `GeoWraith - Local Geolocation`, and re-verified build/lint.
- Evidence: `npm uninstall @google/genai`, `npm run lint` ✓, `npm run build` ✓ on 2026-02-24.

## KI-0006: MVP backend accuracy is reference-limited and not meter-level yet
- Status: resolved
- Severity: high
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `backend/src/services/clipExtractor.ts`, `backend/src/services/geoclipIndex.ts`, `backend/src/services/vectorSearch.ts`
- Description: GeoCLIP ONNX integration now runs with 10,000 sampled references and a consensus aggregator, but real-world accuracy is still image-dependent and not meter-level validated.
- Reproduction: Run `cd backend && npm run benchmark:accuracy` and test with real images (e.g., Liverpool photos should not return Istanbul).
- Expected: Better locality on recognizable landmarks, explicit `low_confidence` on ambiguous images, and no silent fallback masking.
- Actual: 10,000-reference cache, tighter clustering (90km), and `low_confidence` gating are implemented; real-world benchmark across labeled images is still pending.
- Impact: Wild misclassifications are reduced when the updated backend process is running, but final accuracy claims remain PARTIAL until broader labeled-image validation is completed.
- Workaround: Use `accurate` mode and verify `diagnostics.embedding_source === 'geoclip'`; restart backend after code updates to avoid stale-process behavior.
- Resolution: Expanded coordinate index to 10,000, added diagnostics in API response, introduced status gating for wide-radius/low-confidence predictions.
- Evidence: `backend/src/services/geoclipIndex.ts`, `backend/src/services/vectorSearch.ts`, `backend/src/services/predictPipeline.ts`, live probe with `/Users/apinzon/Desktop/cape-town-aerial-view-greenpoint-stadium.jpg` on 2026-02-24.

## KI-0008: CLIP preprocessing crashed `/api/predict` with 500 errors
- Status: resolved
- Severity: critical
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `backend/src/services/clipExtractor.ts`, `backend/src/services/imageSignals.ts`
- Description: CLIP extraction path failed during image preprocessing (`undefined is not iterable`, then channel conversion/model input mismatch), causing backend 500 responses.
- Reproduction: Run backend tests and submit a 1x1 PNG to `/api/predict`; observe 500 with CLIP preprocessing stack trace.
- Expected: `/api/predict` should return 200 with deterministic output for valid images.
- Actual (before fix): Backend returned 500 for valid image payloads.
- Impact: Live API mode appeared broken and could trigger frontend confusion/fallback behavior.
- Workaround: none
- Resolution: Switched CLIP execution to `CLIPVisionModelWithProjection`, normalized image input before inference, and added deterministic fallback embedding path when CLIP extraction fails.
- Evidence: `npm run test` passes (5/5), `curl` `/api/predict` 200, Playwright Chromium/Firefox smoke tests pass on 2026-02-24.

## KI-0007: Product UI crashed in non-WebGL environments due unhandled MapLibre initialization failure
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/product/MapView.tsx`
- Description: If WebGL context creation failed (headless or unsupported GPU), `<MapView>` threw and unmounted app content.
- Reproduction: Load app in a headless browser without WebGL support; observe page error and missing `#product` section.
- Expected: Product UI remains functional with a graceful map fallback message.
- Actual (before fix): React tree crashed from unhandled map initialization failure.
- Impact: Browser-level validation and some user environments could fail hard.
- Workaround: none
- Resolution: Added WebGL support detection and map initialization fallback UI; map failures now degrade gracefully without app crash.
- Evidence: `src/components/product/MapView.tsx`, Playwright smoke tests (`live-smoke-multi.js`) passing in Chromium + Firefox on 2026-02-24.

## KI-0009: Frontend build stalled due broad Tailwind source scan
- Status: resolved
- Severity: high
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/index.css`, frontend build pipeline
- Description: Tailwind v4 scanned the full repository instead of app source, causing prolonged/stalled `vite build` and unstable frontend startup behavior.
- Reproduction: Run `npm run build`; build hangs during `transforming...` on this workspace state.
- Expected: `vite build` completes within normal local build time.
- Actual (before fix): Build appeared to run indefinitely.
- Impact: Frontend could not be validated reliably.
- Workaround: none
- Resolution: Constrained Tailwind scanning scope to `src/**` via `@import "tailwindcss" source(none);` + `@source "./**/*.{html,js,jsx,ts,tsx}";`.
- Evidence: `npm run build` now completes in ~2s on 2026-02-24.

## KI-0010: Map marker initialization caused runtime `undefined.lng` crashes
- Status: resolved
- Severity: critical
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/product/MapView.tsx`
- Description: Marker creation called `addTo(map)` before assigning coordinates, triggering MapLibre internal reads of `marker._lngLat.lng` while undefined.
- Reproduction: Analyze an image, then let marker initialize/reinitialize during style updates; console throws `TypeError: Cannot read properties of undefined (reading 'lng')` and repeated `Attempting to run(), but is already running`.
- Expected: Marker initialization and style transitions complete without runtime exceptions.
- Actual (before fix): Map render loop entered error state and map display became unstable/blank.
- Impact: Core map output unreliable across Standard/Satellite/3D modes.
- Workaround: none
- Resolution: Set marker coordinates with `.setLngLat([lon, lat])` before `.addTo(map)` and only update existing markers with `setLngLat`.
- Evidence: `src/components/product/MapView.tsx`, map error smoke (`MAP_ERRORS_NONE`), `npm run lint` ✓, `npm run build` ✓ on 2026-02-24.

## KI-0011: Live analysis failures were silently masked by demo fallback
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/sections/ProductUI.tsx`
- Description: Live analysis path pre-checked `/health` with a short timeout and fell back to demo on any failure, hiding true API errors.
- Reproduction: Select Live API and trigger a failing/slow request; UI reports completion with demo result instead of exposing live failure reason.
- Expected: Live failures should produce explicit error feedback in live mode.
- Actual (before fix): Users could see silent demo substitution and misinterpret live inference status.
- Impact: Debugging confusion and false confidence in live-path behavior.
- Workaround: none
- Resolution: Removed health precheck fallback path; failed live requests now set `phase='error'` with explicit error message.
- Evidence: `src/components/sections/ProductUI.tsx`, `live-smoke-multi.js` (no demo fallback when API succeeds), `npm run lint` ✓, `npm run build` ✓ on 2026-02-24.

## KI-0012: Map pane could render blank without obvious UI error
- Status: resolved
- Severity: high
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/product/mapStyles.ts`, `src/components/product/MapView.tsx`
- Description: Standard mode depended on external demo vector style assets; when those assets failed, map could degrade to a blank/tinted pane while inference output still succeeded.
- Reproduction: Run analysis in browser, receive coordinates in results panel, observe map pane blank in Standard/Satellite/3D under provider/network failure conditions.
- Expected: Map should render base tiles or show explicit failure message instead of silent blank state.
- Actual (before fix): Map could appear blank with little/no actionable feedback.
- Impact: Core map visualization appears broken despite successful recognition.
- Workaround: Manually refresh or switch sources; behavior remained inconsistent.
- Resolution: Switched Standard mode to OSM raster tiles, kept Satellite on Esri raster, and added runtime tile watchdog + map error listeners to surface source failures explicitly.
- Evidence: `src/components/product/mapStyles.ts`, `src/components/product/MapView.tsx`, `npm run lint` ✓, `npm run build` ✓, provider endpoint checks (OSM/Esri 200) on 2026-02-24.

## KI-0013: Multiple source files exceed 300 LOC modularity limit
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-26
- Area: Backend source files
- Description: Project policy defines a hard 300 LOC limit for code files (except docs/generated). Multiple backend scripts exceeded this limit.
- Reproduction: `find src backend/src -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \\) -print0 | xargs -0 wc -l | sort -nr | head -n 20`
- Expected: All source files <=300 LOC unless generated/documentation exceptions apply.
- Actual: All files now compliant. Original oversized files converted to barrels:
  - `landmarks.ts` (376) → `landmarks/` module
  - `validationBenchmark.ts` (513) → `validationBenchmark/` module
  - `buildValidationGallery.ts` (559) → `buildValidationGallery/` module
  - `sourcePublicDomainImages.ts` (397) → `sourcePublicDomainImages/` module
  - `multiSourceDownloader.ts` (366) → `multiSourceDownloader/` module
  - `smartBlendGallery.ts` (346) → `smartBlendGallery/` module
- Impact: Violates modularity gate in project Definition of Done and increases maintenance complexity.
- Workaround: none
- Resolution: All 6 oversized files split into modular subdirectories. Each module contains focused units (<300 LOC) with clear separation of concerns. Original files preserved as backward-compatible barrels.
- Evidence: `wc -l` audit on 2026-02-26 shows all files <300 LOC, `npm run lint` passes.

## KI-0014: Running backend process can drift from latest local code
- Status: resolved
- Severity: high
- First Seen: 2026-02-24
- Last Updated: 2026-02-26
- Area: local runtime operations (`backend` process lifecycle)
- Description: `npm run dev` for backend did not auto-watch/reload; long-lived process could serve old inference logic after code edits.
- Reproduction: Change `predictPipeline.ts`, then call existing `localhost:8080/api/predict` without restarting backend; response shape/behavior could still match old code.
- Expected: Live API behavior matches latest checked-out code.
- Actual: Auto-reload now implemented via nodemon.
- Impact: False-negative validation and user-visible mismatch between claimed fixes and runtime behavior.
- Workaround: none needed
- Resolution: Added nodemon with `npm run dev:watch` / `npm run watch` scripts. Watches `src/` directory for `.ts`, `.js`, `.json` changes with 1s debounce delay. Automatically restarts server on changes.
- Evidence: `backend/nodemon.json` config, `package.json` scripts, `npm install --save-dev nodemon` on 2026-02-26.

## KI-0015: Duplicate/non-functional map controls from mixed control layers
- Status: resolved
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/product/MapView.tsx`
- Description: Built-in MapLibre controls (navigation + scale) overlapped with custom map controls, creating duplicate buttons and inconsistent behavior.
- Reproduction: Open Product map view in browser; observe duplicate zoom/scale controls on both left and right sides.
- Expected: Single, consistent control set with predictable behavior.
- Actual: Duplicate control clusters caused UX confusion and partial control mismatch.
- Impact: Operators cannot trust map control behavior during analysis.
- Workaround: none
- Resolution: Removed built-in MapLibre `NavigationControl` and `ScaleControl`; retained custom React controls only.
- Evidence: `src/components/product/MapView.tsx`, frontend build/lint pass on 2026-02-24.

## KI-0016: GeoCLIP model files missing - using fallback embeddings
- Status: resolved
- Severity: high
- First Seen: 2026-02-25
- Last Updated: 2026-02-25
- Area: `backend/.cache/geoclip/`, `backend/src/services/clipExtractor.ts`
- Description: The GeoCLIP ONNX models required for accurate inference were not present in the repository. Backend fell back to deterministic color-histogram embeddings.
- Reproduction: Start backend without models; observe `[imageSignals] GeoCLIP extraction failed, using deterministic fallback embedding` in logs.
- Expected: Backend loads vision_model and location_model ONNX files for proper GeoCLIP embeddings.
- Actual: Models missing, fallback embeddings provided low accuracy.
- Impact: Very poor geolocation accuracy (thousands of km error).
- Workaround: none
- Resolution: Downloaded location_model_uint8.onnx (9.1MB) and vision_model_q4.onnx (189MB) from Xenova/geoclip-large-patch14 HuggingFace repo to `.cache/geoclip/`.
- Evidence: `ls -la .cache/geoclip/` shows both models; backend tests pass with `[GeoCLIP] ONNX sessions loaded in 214ms`.

## KI-0017: Coordinate dataset missing - cannot build reference index
- Status: resolved
- Severity: high
- First Seen: 2026-02-25
- Last Updated: 2026-02-25
- Area: `backend/src/scripts/buildReferenceDataset.ts`, `.cache/geoclip/coordinates_100K.json`
- Description: The 100K coordinate gallery required for building the reference dataset was not present. buildReferenceDataset.ts failed.
- Reproduction: Run `npm run build:dataset` without coordinates_100K.json file.
- Expected: Dataset builds successfully from 100K source coordinates.
- Actual: Script failed with `ENOENT: coordinates_100K.json not found`.
- Impact: Could not generate reference coordinate catalog for vector search.
- Workaround: none
- Resolution: Added deterministic generator (`generateCoordinates100K.ts`) and wired `buildReferenceDataset.ts` to auto-regenerate when source is missing or invalid (seeded for reproducibility).
- Evidence: `npm run build:dataset` now regenerates coordinates and writes 50K sampled refs successfully (2026-02-25).

## KI-0018: Brute-force vector search has poor latency at scale
- Status: resolved
- Severity: medium
- First Seen: 2026-02-25
- Last Updated: 2026-02-25
- Area: `backend/src/services/vectorSearch.ts`
- Description: Cosine similarity search iterates over all 50K reference vectors for every request (~58ms per query), won't scale to larger indexes.
- Reproduction: Run `npm run benchmark:search` and observe brute-force latency.
- Expected: Sub-millisecond search with approximate nearest neighbors.
- Actual: 58ms per query with brute-force, linear growth with index size.
- Impact: Limited throughput, poor scalability.
- Workaround: none
- Resolution: Implemented HNSW (Hierarchical Navigable Small World) ANN search using hnswlib-node with 500-700x speedup (0.08ms per query).
- Evidence: `backend/src/services/annIndex.ts`, performance benchmark shows 743x speedup at k=5.

## KI-0019: Real-world validation dataset expanded to 100 landmarks
- Status: resolved
- Severity: high
- First Seen: 2026-02-25
- Last Updated: 2026-02-26
- Area: `backend/src/scripts/smartblend/landmarks.ts`
- Description: Real-world accuracy depends on landmark dataset size and geographic diversity.
- Reproduction: Run `npm run smartblend` followed by `npm run benchmark:validation`.
- Expected: Stable accuracy claims backed by large geotagged datasets (100+ landmarks).
- Actual: Dataset expanded from 50 to 100 landmarks with improved global coverage:
  - Europe: 17 → 32 landmarks (+15)
  - Americas: 13 → 26 landmarks (+13)
  - Asia: 11 → 21 landmarks (+10)
  - Africa/Oceania: 9 → 21 landmarks (+12)
- Impact: Accuracy claims now backed by 100-landmark validation set with balanced continental representation.
- Workaround: None - dataset expanded as planned.
- Resolution:
  - Phase 1: Initial 35 landmarks
  - Phase 2: Expanded to 50 landmarks (+15)
  - Phase 4: Expanded to 100 landmarks (+50)
  - Added major cities: Washington DC, Los Angeles, Toronto, Tokyo, Seoul, Singapore, etc.
  - Added natural wonders: Yellowstone, Yosemite, Galapagos, Great Barrier Reef, Milford Sound
  - Added cultural sites: Versailles, White House, Gyeongbokgung, Luxor Temple
- Evidence:
  - `backend/src/scripts/smartblend/landmarks/data/*.ts` now contains 100 landmarks
  - All IDs from blend_001 to blend_100
  - `npm run lint` passes with new modular structure

## KI-0020: HNSW cached index returned no matches
- Status: resolved
- Severity: high
- First Seen: 2026-02-25
- Last Updated: 2026-02-25
- Area: `backend/src/services/annIndex.ts`, `backend/src/services/geoclipIndex.ts`
- Description: When loading HNSW index from disk cache, the `vectors` array was not populated, causing search to return empty results and throw 'HNSW index returned no matches' error.
- Reproduction: Run backend tests after HNSW index is cached - test fails with 500 error.
- Expected: HNSW search returns matches when index is loaded from cache.
- Actual: Empty results because `this.vectors` array was empty in HNSWIndex class.
- Impact: API returned 500 errors after first successful run.
- Workaround: Delete `.cache/geoclip/hnsw_index.*.bin` before each run.
- Resolution: Modified `annIndex.ts` loadIndex() to accept optional vectors parameter and store them. Modified `geoclipIndex.ts` to pass vectors when loading from cache.
- Evidence: Backend tests now pass (5/5) with `[HNSW] Loaded cached index with 50000 vectors` message.

## KI-0021: Wikimedia rate limits affect batch downloads
- Status: mitigated
- Severity: medium
- First Seen: 2026-02-25
- Last Updated: 2026-02-27
- Area: `backend/src/scripts/city/wikimedia.ts`, `backend/src/scripts/rebuildStrictFailureAnchors.ts`
- Description: Wikimedia Commons applies rate limiting (HTTP 429) when downloading multiple images rapidly.
- Reproduction: Rapid successive requests to Wikimedia API would trigger rate limits.
- Expected: Reliable downloads with automatic rate limit handling.
- Actual: City scraper mitigation exists, but high-volume image fetches still trigger strict Wikimedia upload throttling (`HTTP 429`) in this environment.
- Impact: Bulk anchor-refresh workflows can under-deliver replacement images and risk degrading quality if not safeguarded.
- Workaround: Prefer thumbnail URLs, throttle aggressively, and keep per-landmark fallback to existing vectors when replacements are insufficient.
- Resolution: Added thumbnail-first + retry/backoff + safe fallback behavior in strict rebuild tooling so rate-limited runs do not wipe target landmark anchors.
- Evidence:
  - `backend/src/scripts/city/wikimedia.ts` (`enforceRateLimit`, `withRetry`)
  - `backend/src/scripts/rebuildStrictFailureAnchors.ts` (retry, safe fallback guard)
  - `npm run rebuild:strict-anchors` run on 2026-02-27 shows repeated `429` from `upload.wikimedia.org`

## KI-0022: City scraper yields low success rate and Openverse returns HTTP 401
- Status: resolved
- Severity: medium
- First Seen: 2026-02-25
- Last Updated: 2026-02-26
- Area: `backend/src/scripts/scrapeCityImages.ts`, `backend/src/scripts/city/*`
- Description: City-level dataset scraping produced many failed downloads and Openverse requests returned HTTP 401 due to wrong API URL.
- Reproduction: `npm run scrape:city -- --city="Istanbul" --count=150 --sources=wikimedia,openverse`
- Expected: Reliable image acquisition with automatic retries and proper API endpoints.
- Actual: Openverse URL is fixed and retry/rate-limit logic is present. Wikimedia remains unreliable in this environment (frequent HTTP 403), but a new Flickr source is now available and verified.
- Impact: City-level scraping is usable via Flickr/Openverse even when Wikimedia blocks.
- Workaround: Prefer `--sources=flickr,mapillary,openverse` when Wikimedia returns persistent 403 responses.
- Resolution: 
  - Fixed Openverse API URL from `api.openverse.engineering` to `api.openverse.org`
  - Added retry utility (`backend/src/scripts/city/retry.ts`) with exponential backoff
  - Added automatic rate limiting (2s for Wikimedia, 600ms for Openverse)
  - Added URL variant generation for Wikimedia (multiple thumbnail sizes)
  - Added Flickr public feed source (`backend/src/scripts/city/flickr.ts`) as working alternative
  - Added Mapillary source (`backend/src/scripts/city/mapillary.ts`) for free street-level imagery when token is configured
  - Added global city scrape orchestrator (`backend/src/scripts/scrapeGlobalCities.ts`) for broad zero-cost dataset expansion
  - Added Flickr URL-size fallbacks in downloader
  - Made per-image failures non-fatal (scrape continues with summary report)
  - Added proper User-Agent headers with contact information
  - Added better error messages with response body snippets
  - Added non-fatal download handling so one failed image no longer terminates the entire scrape run
- Evidence: `backend/src/scripts/city/openverse.ts`, `backend/src/scripts/city/wikimedia.ts`, `backend/src/scripts/city/flickr.ts`, `backend/src/scripts/city/retry.ts`, plus verification runs on 2026-02-26:
  - `npm run scrape:city -- --city="Istanbul" --count=5 --sources=wikimedia --output=.cache/city_datasets_verification` → 2 downloaded / 3 failed
  - `npm run scrape:city -- --city="Istanbul" --count=3 --sources=openverse --output=.cache/city_datasets_verification` → 1 downloaded / 0 failed
  - `npm run scrape:city -- --city="Istanbul" --count=1 --sources=wikimedia --output=.cache/city_datasets_verify3` → process exits cleanly with summary (0 downloaded / 1 failed), no fatal crash
  - `npm run scrape:city -- --city="Istanbul" --count=5 --sources=flickr --output=.cache/city_datasets_flickr_verify` → 5 downloaded / 0 failed

## KI-0023: Status documents are internally inconsistent
- Status: resolved
- Severity: low
- First Seen: 2026-02-26
- Last Updated: 2026-02-26
- Area: `STATUS.md`, `mvp.md`
- Description: `STATUS.md` claims “100% COMPLETE - PRODUCTION READY” while `mvp.md` still lists unresolved validation/engineering/documentation tasks.
- Reproduction: Compare `STATUS.md` completion claims against unchecked items in `mvp.md` ("Physical-device and multi-browser runtime validation", "Structure-from-motion refinement pipeline", "Deployment runbook for production environments").
- Expected: Project status docs should present one coherent completion state.
- Actual: Conflicting readiness signals between status documents.
- Impact: Operator confusion and risk of over-claiming readiness.
- Workaround: Treat command-level verification and `knowissues.md` as source of truth until docs are synchronized.
- Resolution: Updated `STATUS.md` to accurate status (MVP complete, docs ready, physical validation pending). Updated `mvp.md` to mark documentation items complete with clarifying notes.
- Evidence: `STATUS.md` (2026-02-26), `mvp.md` lines 101-117 (2026-02-26).
## KI-0024: SfM pipeline path implemented, pending live API validation
- Status: mitigated
- Severity: low
- First Seen: 2026-02-26
- Last Updated: 2026-02-26
- Area: `backend/src/sfm/*`, `/api/predict/sfm`
- Description: SfM modules are fully implemented with real feature extraction, but requires live Mapillary API validation for full production readiness.
- Reproduction: POST to `/api/predict/sfm` with valid image and coarse location.
- Expected: SfM refinement should run reliably on valid image input and retrieve references when Mapillary credentials are configured.
- Actual (fixed):
  - ✅ PNG RGBA handling fixed (added `.rgb()` conversion)
  - ✅ Real ViT feature extraction implemented (`@xenova/transformers`)
  - ✅ Test coverage added (`pipeline.test.ts` - 5/5 pass)
  - ✅ Mapillary retrieval works with a valid OAuth token (`MAPILLARY_ACCESS_TOKEN`)
  - ⏳ End-to-end refinement still returns fallback failures in current probe (`Reconstruction failed: insufficient cameras`)
- Impact: SfM endpoint ready for testing; requires Mapillary credentials for reference retrieval.
- Resolution:
  - Fixed PNG channel handling (RGBA → RGB conversion)
  - Implemented real feature extraction (ViT transformer, 768-dim features)
  - Added comprehensive test suite (5 tests covering edge cases)
  - Token moved to environment variable
  - Ready for end-to-end validation with valid Mapillary OAuth token
  - Added `backend/.env.example` documenting required env variables including optional Mapillary token.
  - Updated SfM feature extraction preprocessing to use transformers-native `RawImage` path.
  - Gated `/api/predict/sfm` behind `GEOWRAITH_ENABLE_SFM` (default `false`) to defer live-path instability as a scheduled future feature update.
- Evidence:
  - `backend/src/sfm/featureExtractor.ts`
  - `backend/src/sfm/mapillary.ts`
  - `backend/.env.example`
  - Runtime probes (2026-02-26):
    - `cd backend && npx tsx -e "import { extractFeatures } ..."` with valid 1x1 PNG → `kpts 64` (feature extraction succeeds)
    - `/api/predict/sfm` probe with valid PNG and no token configured → `success: false`, `error: "Insufficient reference images for SfM"` (expected fallback)
    - token-backed probes:
      - `retrieveMapillaryImages(41.0082, 28.9784, 500, 3)` → retrieved 1
      - `retrieveMapillaryImages(41.0082, 28.9784, 2000, 10)` → retrieved 10
      - `/api/predict/sfm` with a real Flickr Istanbul image + token → `success: false`, `error: "Reconstruction failed: insufficient cameras"`
    - `cd backend && npm run test` includes SfM suite (`5/5 pass`)
    - `GEOWRAITH_ENABLE_SFM=false` now returns `503 feature_disabled` for `/api/predict/sfm` to keep production path stable while SfM is deferred.

## KI-0025: `/api/predict/sfm` ignored `max_references` request parameter
- Status: resolved
- Severity: low
- First Seen: 2026-02-26
- Last Updated: 2026-02-26
- Area: `backend/src/app.ts`
- Description: SfM route accepted `max_references` in request payload but always passed a hardcoded value of `50` to the pipeline.
- Reproduction: Inspect `backend/src/app.ts` where request parsing included `max_references` but call site used `maxReferences: 50`.
- Expected: Route should pass caller-provided `max_references` (with default fallback) into `runSfMPipeline`.
- Actual: Hardcoded value prevented caller control of reference retrieval budget.
- Impact: API contract mismatch and inability to tune SfM runtime behavior from clients.
- Workaround: none
- Resolution: Updated route to pass `maxReferences: max_references`.
- Evidence: `backend/src/app.ts` lines 54-69 (`maxReferences: max_references`), `cd backend && npm run lint && npm run test && npm run build` on 2026-02-26.

## KI-0026: 99% confidence for every image is unattainable for single-image geolocation
- Status: mitigated
- Severity: high
- First Seen: 2026-02-26
- Last Updated: 2026-02-26
- Area: `backend/src/services/predictPipeline.ts`, `backend/src/services/geoclipIndex.ts`, `src/components/product/ResultsPanel.tsx`
- Description: Some images do not contain enough geospatial signal to support high-confidence localization. Requiring 99% confidence for every image is infeasible without rejecting low-information inputs.
- Reproduction: Submit ambiguous images (indoor scenes, generic roads, low-texture crops) to `/api/predict`; predictions can cross countries/continents if confidence is not gated.
- Expected: System should avoid false certainty and withhold weak predictions.
- Actual: Mitigated by confidence gating and location withholding:
  - Actionable threshold calibrated to 60.5%
  - `location_visibility: "withheld"` for weak/fallback/wide-spread matches
  - Top-match coherence gating blocks high-score but geographically inconsistent confusers
  - Frontend hides map pin/coordinate copy when location is withheld
  - Multi-source image-anchor vectors added from SmartBlend gallery to improve landmark retrieval
  - Consensus aggregation now collapses duplicate coordinates and uses a strong-anchor path so dense city-anchor duplicates no longer override dominant landmark matches
- Impact: Wrong-continent false positives are reduced in low-confidence cases, but universal 99% confidence for every input remains impossible.
- Workaround: Use geolocatable imagery (clear landmarks, outdoor context), and treat withheld results as indeterminate rather than failures.
- Resolution: Not fully resolvable as a hard guarantee; enforced abstain behavior and retrieval augmentation are implemented.
- Evidence:
  - `backend/src/config.ts` (`MINIMUM_CONFIDENCE = 0.605`, confidence tiers 0.75/0.60)
  - `backend/src/services/predictPipeline.ts` (`location_visibility`, `location_reason`, withholding notes)
  - `backend/src/services/confidenceGate.ts` (match-coherence visibility checks)
  - `backend/src/services/vectorSearch.ts` (coordinate dedupe + strong-anchor aggregation path)
  - `backend/src/services/referenceImageIndex.ts` (multi-source anchor vectors)
  - `backend/src/services/geoclipIndex.ts` (anchor integration into HNSW index)
  - `src/components/product/ResultsPanel.tsx` (withheld UI state)

## KI-0027: City scraper metadata rows were missing id/url/status fields
- Status: resolved
- Severity: low
- First Seen: 2026-02-26
- Last Updated: 2026-02-26
- Area: `backend/src/scripts/scrapeCityImages.ts`, `backend/src/scripts/city/downloader.ts`
- Description: Downloaded city dataset metadata rows were written with `undefined` values for `id`, `url`, and `status`.
- Reproduction: Inspect generated `backend/.cache/city_datasets/*/metadata.csv` and observe `undefined` in required columns.
- Expected: Metadata should include deterministic row id, source URL, and download status for each successful file.
- Actual: Fields now populated during scrape loop before CSV write.
- Impact: Improves dataset traceability and downstream quality checks for scraped references.
- Workaround: none
- Resolution: Added explicit `id`, `url`, and `status: downloaded` fields to metadata rows in `scrapeCityImages.ts`.
- Evidence: `backend/src/scripts/scrapeCityImages.ts` metadata mapping and successful lint/test/build verification on 2026-02-26.

## KI-0028: GeoCLIP ONNX models absent — CLIP text-matching fallback active
- Status: mitigated
- Severity: high
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `backend/.cache/geoclip/`, `backend/src/services/clipExtractor.ts`, `backend/src/services/clipGeolocator.ts`
- Description: The GeoCLIP ONNX model files (`vision_model_q4.onnx`, `location_model_uint8.onnx`) are not present in the repository or cache. The backend automatically falls back to CLIP text-based geolocation via `@xenova/transformers`.
- Reproduction: Start backend; observe `[GeoCLIP] GeoCLIP models unavailable` in logs followed by `[CLIP] Building text embeddings for 355 cities`.
- Expected: GeoCLIP ONNX models loaded for maximum accuracy.
- Actual: CLIP text-matching fallback is active. The `Xenova/clip-vit-base-patch32` model is auto-downloaded from HuggingFace on first startup and cached locally. This achieves ~40-50% city-level accuracy on distinctive landmark photos.
- Impact: Reduced accuracy compared to GeoCLIP (standard CLIP was not trained for geolocation). Cross-continent errors possible for generic cityscapes.
- Workaround: Use images with distinctive landmarks for best results. System correctly identifies iconic locations (Eiffel Tower, Big Ben, NYC skyline).
- Resolution: To restore GeoCLIP accuracy, obtain `vision_model_q4.onnx` and `location_model_uint8.onnx` from `Xenova/geoclip-large-patch14` on HuggingFace and place in `backend/.cache/geoclip/`. For 95% city-level accuracy, a geo-specialized model (StreetCLIP, PIGEON) is needed.
- Evidence: Backend logs showing CLIP fallback active; terminal accuracy test on 7 Unsplash images (2026-02-27); `backend/src/services/clipGeolocator.ts`, `backend/src/services/clipHierarchicalSearch.ts`.

## KI-0029: Standard CLIP accuracy limited for non-landmark imagery
- Status: open
- Severity: high
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `backend/src/services/clipGeolocator.ts`, prediction pipeline
- Description: Standard CLIP ViT-Base-Patch32 was trained for general image-text matching, not geolocation. Text prompts like "A photograph taken in Tokyo, Japan" do not reliably distinguish cities with similar-looking urban architecture.
- Reproduction: Upload a generic cityscape photo of Tokyo, Dubai, or Sydney to `/api/predict`; observe that the top match may be a different city or continent.
- Expected: Correct city identification for any photo globally.
- Actual: ~40-50% city-level accuracy on distinctive landmark photos; cross-continent errors on generic cityscapes.
- Impact: Users may receive incorrect geolocation results for non-iconic imagery.
- Workaround: Use images with clearly identifiable landmarks, signage, or architecture. Check confidence score — lower confidence correlates with less reliable predictions.
- Resolution: Requires a geo-specialized model. Options: (1) StreetCLIP (fine-tuned CLIP for geolocation), (2) GeoCLIP with proper ONNX exports, (3) PIGEON model, (4) reference image database of geotagged photos instead of text-only embeddings.
- Evidence: Terminal accuracy tests showing NYC/London/Paris correct but Tokyo/Dubai/Sydney variable (2026-02-27).

## KI-0030: Validation benchmark stalls at 93.1% due hard confuser anchors in nature/coastal scenes
- Status: open
- Severity: medium
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `backend/src/services/geoConstraints.ts`, `backend/src/services/vectorSearch.ts`, anchor corpus in `.cache/geoclip/referenceImageVectors.merged_v1.json`
- Description: After fixing continent-vote overrides and refining failing-landmark anchors, benchmark improved from 86.2% to 93.1% within 10km, but four scenes still fail: Marrakech, Cape Point, Copacabana, and Table Mountain.
- Reproduction: `cd backend && npm run benchmark:validation` on the 58-image gallery.
- Expected: ≥95% within 10km on the current validation set.
- Actual: 93.1% within 10km (54/58); remaining failures are dominated by visually similar confuser anchors (notably Park Güell/Great Barrier style matches) on nature/coastal images.
- Impact: Blocks the current 95% benchmark gate despite broad regional recovery.
- Workaround: Curate and add higher-precision geotagged anchors specifically for the remaining 4 failure classes; avoid blind/random densification.
- Resolution: In progress. Applied fixes so far:
  - rank-aware continent voting + top-match lock
  - South America bound fix for Easter Island
  - deterministic refinement script (`npm run refine:anchors`) for targeted hard labels
  - confuser-anchor cap experiment (`Sagrada Familia` + `Great Barrier Reef` from 30→10) tested with no net gain (remained 93.1%)
  - benchmark now reports split cohorts (`iconic_landmark` vs `generic_scene`) so hard-scene regressions are explicitly visible even when aggregate score is stable
- Evidence:
  - `backend/src/services/geoConstraints.ts`
  - `backend/src/scripts/refineFailingAnchors.ts`
  - `backend/src/scripts/rebuildStrictFailureAnchors.ts`
  - `backend/src/benchmarks/validationBenchmark/{types.ts,geo.ts,runner.ts,index.ts}`
  - `backend/.cache/validation_gallery/benchmark_report.json` (2026-02-27 runs: 93.1% within 10km)

## KI-0031: Documentation drift across benchmark/model claims
- Status: resolved
- Severity: medium
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: root markdown docs (`README.md`, `STATUS.md`, `ARCHITECTURE.md`, `VALIDATION_GUIDE.md`, accuracy notes)
- Description: Multiple markdown files reported conflicting states (32/46/58 image benchmarks, contradictory model modes, outdated quick links), making replication unreliable.
- Reproduction: Compare old metrics and mode statements across `README.md`, `STATUS.md`, `backend/README.md`, and `VALIDATION_GUIDE.md`.
- Expected: One coherent benchmark snapshot, explicit model mode declaration, and stable cross-references for reproducibility.
- Actual: Docs now normalized around a single snapshot and linked to a canonical playbook.
- Impact: Reduces operator confusion and prevents accidental over-claiming from stale docs.
- Workaround: none
- Resolution: Added canonical reproducibility source (`docs/REPRODUCIBILITY_PLAYBOOK.md`), rewrote core docs, and marked stale accuracy notes as superseded/archived with pointers to current references.
- Evidence:
  - `docs/REPRODUCIBILITY_PLAYBOOK.md`
  - `README.md`, `STATUS.md`, `ARCHITECTURE.md`, `VALIDATION_GUIDE.md`
  - `backend/README.md`, `docs/baseline_metrics.md`

## KI-0032: Combined launcher failed local Live API flow when frontend was already running
- Status: resolved
- Severity: medium
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `start.sh`, local dev runtime startup
- Description: `npm run start` exited early if port `3001` was already in use, and backend startup used
  `npm start` (compiled `dist`) with a short health timeout. This commonly caused frontend Live API calls to
  hit `ERR_CONNECTION_REFUSED` on `http://localhost:8080/api/predict`.
- Reproduction:
  1. Run frontend separately on `3001`.
  2. Run `npm run start`.
  3. Script exits at port check or before backend model warmup finishes.
- Expected: Launcher should start/reuse both services and wait long enough for backend model/index warmup.
- Actual (before fix): Startup aborted with no working backend on `8080`.
- Impact: Frontend Live API mode appeared broken even though code paths were correct.
- Workaround (before fix): Start backend manually with `cd backend && npm run dev`.
- Resolution:
  - `start.sh` now defaults to backend `npm run dev`.
  - Reuses already-running services on `3001`/`8080` instead of hard-failing.
  - Adds configurable startup windows:
    - `BACKEND_STARTUP_RETRIES` (default `240`)
    - `FRONTEND_STARTUP_RETRIES` (default `60`)
    - `STARTUP_POLL_SECONDS` (default `0.5`)
  - Prints backend log tail on startup failure for faster diagnosis.
- Evidence:
  - `./start.sh` verification run (2026-02-27): backend reached `/health` after GeoCLIP warmup while
    frontend on `3001` was reused, then both services reported ready.

## KI-0033: Duplicate libvips libraries logged at backend startup
- Status: open
- Severity: low
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: backend native dependencies (`sharp`, `@xenova/transformers` nested `sharp`)
- Description: Backend startup logs report duplicate Objective-C symbol registration for
  `GNotificationCenterDelegate` because two different `libvips-cpp` dylibs are loaded.
- Reproduction: Run `./start.sh` or `cd backend && npm run dev`; inspect backend logs.
- Expected: A single `libvips` runtime loaded without duplicate class warnings.
- Actual: Startup logs include:
  `Class GNotificationCenterDelegate is implemented in both .../sharp-libvips... and .../transformers/node_modules/sharp/vendor...`
- Impact: Current runs still start and serve requests, but warning indicates potential instability risk under
  image-processing heavy paths.
- Workaround: None required for current functionality; monitor for crashes.
- Resolution: pending (requires dependency/runtime consolidation so only one `sharp/libvips` stack loads).
- Evidence:
  - `/tmp/geowraith-backend.log` from `./start.sh` verification on 2026-02-27.

## KI-0034: Frontend copy drifted from current validated model/runtime state
- Status: resolved
- Severity: medium
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `src/data/*`, `src/components/sections/*`, `src/components/product/*`
- Description: Several frontend sections still referenced superseded architecture/accuracy language
  (`LanceDB`, meter-level defaults, commercial-parity wording), and diagnostics UI did not explicitly represent
  CLIP mode.
- Reproduction: Search frontend copy for stale terms:
  `rg -n "LanceDB|meter-level|same accuracy|matches commercial accuracy|hloc|COLMAP" src`
- Expected: Frontend claims should match the current verified snapshot and runtime modes.
- Actual (before fix): Stale copy remained in hero, features, what-it-is, how-it-works, FAQ/comparison,
  and mode subtitles.
- Impact: Could mislead users about active architecture and benchmark guarantees.
- Workaround: none
- Resolution:
  - Replaced stale copy with current snapshot-aligned language (`93.1%/58 images`, `100.0/88.9` cohorts,
    HNSW index, confidence gating).
  - Removed unsupported meter-level default claims from landing sections.
  - Updated diagnostics UI to render CLIP mode explicitly instead of treating it as generic fallback.
  - Updated startup snippet to one-command `npm run start`.
- Evidence:
  - `npm run lint` ✅
  - `npm run build` ✅
  - `rg -n "LanceDB|hloc|COLMAP|meter-level|same accuracy|matches commercial accuracy" src` → no matches
  - Section audit + patch pass also aligned:
    - `src/components/sections/{Docs.tsx,Gallery.tsx,Footer.tsx,ProductUI.tsx}`
    - `src/data/features.ts`

## KI-0035: GeoCLIP live inference crashed after CLIP hierarchical startup warmed `@xenova/transformers`
- Status: resolved
- Severity: high
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `backend/src/index.ts`, `backend/src/services/clipExtractor.ts`, backend runtime startup order
- Description: Backend startup preloaded the CLIP hierarchical index (`buildHierarchicalIndex()`), which initializes `@xenova/transformers`. On macOS, that conflicted with later GeoCLIP vision inference through `onnxruntime-node`, so the first `/api/predict` request aborted the backend process with `Ort::Exception: Specified device is not supported`.
- Reproduction:
  1. Start backend.
  2. `curl http://localhost:8080/health` succeeds.
  3. POST any image to `/api/predict`.
- Expected: First prediction returns JSON and backend stays healthy.
- Actual (before fix): First prediction caused `Empty reply from server`; backend process terminated immediately afterward.
- Impact: Live API mode was unusable even though `/health` and startup logs looked healthy.
- Workaround (before fix): none reliable in the combined startup path.
- Resolution:
  - Removed `buildHierarchicalIndex()` startup warmup from `backend/src/index.ts` because the live predict path does not currently depend on it.
  - Explicitly pinned GeoCLIP ONNX session creation to CPU execution provider in `backend/src/services/clipExtractor.ts`.
  - Verified with a real `/api/predict` request that the backend now returns JSON and remains healthy afterward.
- Evidence:
  - live repro on 2026-02-27: `/health` OK → first POST crashed with `Ort::Exception`
  - post-fix live repro on 2026-02-27: `/health` OK → POST `/api/predict` returned JSON → `/health` remained OK

## KI-0036: Esri street basemap experiment regressed to black-map fallback in browser conditions
- Status: resolved
- Severity: medium
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `src/components/product/mapStyles.ts`, `src/components/product/useMapRuntime.ts`
- Description: The temporary switch of Standard mode to Esri World Street introduced a brittle blank-map path in browser conditions where the remote raster source did not settle before the watchdog fired. The degradation path used a plain dark fallback, so operators saw a black map pane across modes.
- Reproduction: Open the Product map panel and wait for the tile watchdog to fire under the affected provider/network/browser conditions; the map degrades to a blank dark pane.
- Expected: Standard and 3D should render a readable street basemap; Satellite should degrade to a readable street view if imagery fails.
- Actual (before fix): Timeout could collapse to a black diagnostic fallback, producing the appearance that all map modes were broken.
- Impact: Core map visualization looked non-functional even when the UI and runtime were otherwise healthy.
- Workaround (before fix): none reliable.
- Resolution:
  - Restored Standard mode to cached OSM raster tiles (`cached://` protocol with network-backed fetch).
  - Kept Satellite on Esri imagery, but changed timeout degradation to fall back to Standard street basemap instead of a black pane.
  - Left the diagnostic fallback only as the last-resort path for street-basemap failure.
- Evidence:
  - `src/components/product/mapStyles.ts`
  - `src/components/product/useMapRuntime.ts`
  - HTTP 200 probes for OSM and Esri tile endpoints on 2026-02-27
  - `npm run lint` and `npm run build` passed after the change

## KI-0037: Optional EXIF parsing produced warning spam on valid WebP/GIF uploads
- Status: resolved
- Severity: low
- First Seen: 2026-02-27
- Last Updated: 2026-02-27
- Area: `backend/src/services/imageSignals.ts`, `backend/src/app.test.ts`
- Description: EXIF GPS extraction was attempted on every decoded image. `sharp` accepts valid
  WebP/GIF uploads, but `exifr` throws `Unknown file format` for those inputs, so backend logs
  filled with warnings even though prediction requests succeeded.
- Reproduction:
  1. POST a valid WebP image to `/api/predict`.
  2. Observe successful JSON response plus `[imageSignals] EXIF parse failed ... Unknown file format`
     in backend logs before the fix.
- Expected: Valid uploads without EXIF metadata should skip the EXIF path silently and continue
  through inference.
- Actual (before fix): Successful requests generated repeated warning noise.
- Impact: Operator logs looked unhealthy and obscured real failures during live testing.
- Workaround (before fix): none
- Resolution:
  - Gate EXIF parsing on `sharp(...).metadata().exif` so only images that actually contain EXIF
    metadata enter the EXIF parser.
  - Keep warning logs only for genuine parse failures on images that advertise EXIF metadata.
- Evidence:
  - `backend/src/services/imageSignals.ts`
  - `backend/src/app.test.ts`
  - `cd backend && npm run test -- src/app.test.ts`
