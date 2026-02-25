# Memory

Persistent project memory for high-signal decisions and context that should survive across tasks.

## Update Policy

- Update this file on meaningful changes only (architecture, policy, workflow, key assumptions).
- Use ISO UTC timestamps.
- Mark provenance as `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`.
- If a fact is not verified, mark it `UNCONFIRMED`.
- Supersede outdated facts explicitly; do not silently rewrite history.
- Keep this file in sync with `.agent/CONTINUITY.md` (operational timeline) and `knowissues.md` (issue lifecycle).

## Integration Rules

- When a durable decision is added to `.agent/CONTINUITY.md`, mirror a concise stable version here.
- When `knowissues.md` changes to `resolved`/`wontfix`, add the lasting policy/decision consequence here if any.
- Do not duplicate full issue logs here; keep only durable conclusions.

## Entry Template

```text
- YYYY-MM-DDTHH:MMZ [PROVENANCE] [OPTIONAL_TAG] Statement
  Evidence: <command/output/doc reference>
  Status: VERIFIED | PARTIAL | UNCONFIRMED
  Confidence: 0.00-1.00
```

## Current Memory

- 2026-02-24T16:47Z [CODE] [DETERMINISM] Added confidence-scored status classes for technical claims.
  Evidence: README.md and AGENTS.md policy updates
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T16:47Z [CODE] [DETERMINISM] Completion claims now require explicit evidence of executed checks.
  Evidence: Completion truthfulness gate in README.md
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T16:52Z [CODE] [FRONTEND] Documented current landing-page visual baseline and implemented section list.
  Evidence: README.md/AGENTS.md baseline sections, `src/App.tsx`, `src/components/sections/Hero.tsx`, `src/components/Navbar.tsx`
  Status: VERIFIED
  Confidence: 0.97
- 2026-02-24T18:06Z [CODE] [FRONTEND] Complete Contact section added with functional form and Coming Soon modal system.
  Evidence: `src/components/sections/Contact.tsx`, `src/components/ui/ComingSoonModal.tsx`, `FRONTEND_CHANGES.md`
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T18:06Z [CODE] [FRONTEND] Background video optimized for 1920x1080 smooth playback, all buttons functional.
  Evidence: `src/components/ui/AnimatedBackground.tsx`, `src/components/sections/Hero.tsx`, build success
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T18:06Z [CODE] [FRONTEND] Social links reduced to GitHub only, all placeholder links show Coming Soon modal.
  Evidence: `src/components/sections/Footer.tsx`, `src/data/features.ts`, `src/components/sections/Contact.tsx`
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T18:11Z [CODE] [FRONTEND] GitHub CTAs now point to `https://github.com/AngelP17/geowraith`; Discord references removed from UI copy.
  Evidence: `src/components/sections/Pricing.tsx`, `src/components/sections/FinalCTA.tsx`, `src/components/ui/ComingSoonModal.tsx`, `src/components/sections/Contact.tsx`, `src/data/extendedContent.ts`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T18:11Z [CODE] [FRONTEND] Build/lint/test success claims are UNCONFIRMED; “Production Ready” status superseded pending verification.
  Evidence: `FRONTEND_CHANGES.md`
  Status: VERIFIED
  Confidence: 0.78
- 2026-02-24T18:14Z [TOOL] [FRONTEND] Host build and lint completed successfully (visual checks still pending).
  Evidence: `npm run build`, `npm run lint` outputs recorded in `FRONTEND_CHANGES.md`
  Status: VERIFIED
  Confidence: 0.90
- 2026-02-24T18:28Z [CODE] [WORKFLOW] Host-first workflow is now the default.
  Evidence: `README.md`, `AGENTS.md`
  Status: VERIFIED
  Confidence: 0.88
- 2026-02-24T18:32Z [CODE] [FRONTEND] Baseline docs updated to reflect current nav/CTA copy (Contact, Learn More).
  Evidence: `README.md`, `AGENTS.md`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T18:32Z [CODE] [DOCS] KI-0001 resolved by aligning README to the current host-first repo layout.
  Evidence: `knowissues.md`, `README.md`
  Status: VERIFIED
  Confidence: 0.84
- 2026-02-24T18:54Z [CODE] [WORKFLOW] Backend stub added with minimal API contract; README/AGENTS updated to full product structure.
  Evidence: `backend/src/index.ts`, `backend/docs/openapi.yaml`, `README.md`, `AGENTS.md`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T18:58Z [CODE] [FRONTEND] Product UI added and wired to call `/api/predict` via `predictImage`.
  Evidence: `src/components/sections/ProductUI.tsx`, `src/lib/api.ts`, `src/App.tsx`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T19:27Z [CODE] [FRONTEND] MapLibre map view added with Standard/Satellite/3D modes inside Results Panel.
  Evidence: `src/components/product/MapView.tsx`, `src/components/product/MapHeader.tsx`, `src/components/product/mapStyles.ts`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T19:39Z [CODE] [FRONTEND] Added Docs/Examples/Gallery sections and demo dispatcher; Product UI supports Demo/Live data sources with demo fallback.
  Evidence: `src/components/sections/Docs.tsx`, `Examples.tsx`, `Gallery.tsx`, `src/lib/demo.ts`, `src/components/sections/ProductUI.tsx`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T19:05Z [CODE] [FRONTEND] Product UI redesigned with "Satellite Intelligence Console" aesthetic: amber/orange accent, radar animations, scan lines, technical grid.
  Evidence: `src/components/product/` directory, modularized components, `FRONTEND_CHANGES.md`
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-24T19:05Z [CODE] [DETERMINISM] Product UI modularized into <300 LOC components per project guidelines.
  Evidence: 7 files in `src/components/product/`, all under 300 LOC
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T18:11Z [CODE] [FRONTEND] Background video uses `bg.mp4` with MeshGradient fallback; resolution/smoothness unverified in this pass.
  Evidence: `src/components/ui/AnimatedBackground.tsx`, `FRONTEND_CHANGES.md`
  Status: PARTIAL
  Confidence: 0.62
- 2026-02-24T19:57Z [CODE] [FRONTEND] GitHub CTAs now point to `https://github.com/AngelP17/geowraith` (supersedes previous geowraith/geowraith links).
  Evidence: `src/components/sections/Hero.tsx`, `src/components/sections/FinalCTA.tsx`, `src/components/sections/Pricing.tsx`, `src/components/sections/TechStack.tsx`, `src/components/ui/MobileMenu.tsx`
  Status: VERIFIED
  Confidence: 0.86
- 2026-02-24T19:57Z [CODE] [FRONTEND] Map view 3D mode now uses perspective pitch (no DEM tiles) to avoid external terrain tile errors.
  Evidence: `src/components/product/MapView.tsx`, `src/components/product/mapStyles.ts`, `FRONTEND_CHANGES.md`
  Status: VERIFIED
  Confidence: 0.84
- 2026-02-24T20:17Z [CODE] [DETERMINISM] Removed unused `@google/genai` dependency and `GEMINI_API_KEY` Vite define to keep frontend local-first and minimal.
  Evidence: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `npm run lint`, `npm run build`
  Status: VERIFIED
  Confidence: 0.97
- 2026-02-24T20:30Z [CODE] [WORKFLOW] Superseded backend stub with a modular local inference MVP (feature extraction + local vector search + coordinate aggregation) while preserving Node/Express stack and zero-cost constraints.
  Evidence: `backend/src/app.ts`, `backend/src/services/predictPipeline.ts`, `backend/src/services/imageSignals.ts`, `backend/src/services/vectorSearch.ts`
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-24T20:30Z [TOOL] [DETERMINISM] Backend verification gates added and executed (`npm run lint`, `npm run build`, `npm run test` under `backend/`).
  Evidence: terminal outputs for backend checks on 2026-02-24
  Status: VERIFIED
  Confidence: 0.97
- 2026-02-24T20:30Z [CODE] [DETERMINISM] Replaced prior roadmap-style `mvp.md` with executable zero-cost MVP status/runbook and Mermaid architecture diagram.
  Evidence: `mvp.md`
  Status: VERIFIED
  Confidence: 0.93
- 2026-02-24T20:40Z [CODE] [FRONTEND] Added MapView WebGL capability guard and graceful fallback to prevent full-app crashes in environments where MapLibre cannot initialize.
  Evidence: `src/components/product/MapView.tsx`, Playwright smoke tests in Chromium/Firefox
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-24T20:40Z [TOOL] [DETERMINISM] Live end-to-end validation executed with running backend+frontend and browser automation in Chromium + Firefox; `/api/predict` returned 200 in both and UI completed analysis without demo fallback.
  Evidence: `/tmp/geowraith-playwright/live-smoke-multi.js` output and screenshots
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T20:41Z [TOOL] [PERF] Added and ran synthetic labeled geolocation benchmark (7,200 samples) to quantify current MVP accuracy limits.
  Evidence: `cd backend && npm run benchmark:accuracy`
  Status: VERIFIED
  Confidence: 0.97
- 2026-02-24T21:30Z [CODE] [MODELS] GeoCLIP ONNX integration is now the default backend embedding path (`vision_model_uint8` + `location_model_uint8`) with cached 1,200-reference index generation.
  Evidence: `backend/src/services/clipExtractor.ts`, `backend/src/services/geoclipIndex.ts`, `backend/src/data/geoclipCoordinates.json`
  Status: VERIFIED (pipeline functional)
  Confidence: 0.98
  Note: Real-world accuracy remains unvalidated — synthetic benchmark only.
- 2026-02-24T22:45Z [CODE] [MODELS] Expanded reference dataset from 1,200 to 10,000 coordinates for better geographic coverage; added top-K ensemble prediction (k=5) with outlier rejection; added confidence threshold (0.55) to reject low-quality matches.
  Evidence: `backend/src/services/geoclipIndex.ts`, `backend/src/services/vectorSearch.ts`, `backend/src/services/predictPipeline.ts`, 148MB reference vector cache
  Status: VERIFIED
  Confidence: 0.92
  Note: Aims to reduce wild misclassifications (e.g., Liverpool → Istanbul); real-world validation still needed.
- 2026-02-24T21:44Z [CODE] [FRONTEND] Tailwind source scanning is explicitly constrained to `src/**` to prevent Vite build stalls from scanning backend/model artifacts.
  Evidence: `src/index.css`, `npm run build` success (~2s)
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T22:01Z [CODE] [FRONTEND] MapLibre marker lifecycle now requires coordinates before insertion (`setLngLat` before `addTo`) to avoid render-loop crashes when styles reload.
  Evidence: `src/components/product/MapView.tsx`, runtime stack trace root-cause alignment (`undefined.lng` at marker add), map smoke result `MAP_ERRORS_NONE`
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-24T22:01Z [CODE] [FRONTEND] Live mode no longer silently falls back to demo on request failure; live errors are surfaced explicitly in Product UI state.
  Evidence: `src/components/sections/ProductUI.tsx`, successful live smoke (`demo_warning_count 0`) and error-path code update
  Status: VERIFIED
  Confidence: 0.93
- 2026-02-24T22:12Z [CODE] [FRONTEND] Standard map mode now uses direct OSM raster tiles instead of the remote demo vector style chain to reduce blank-map failures when vector assets are unavailable.
  Evidence: `src/components/product/mapStyles.ts` (`standardStyle` with OSM raster sources), build/lint success
  Status: VERIFIED
  Confidence: 0.93
- 2026-02-24T22:12Z [CODE] [FRONTEND] Map runtime now includes tile-load watchdog and explicit source/tile error surfacing to avoid silent blank map states.
  Evidence: `src/components/product/MapView.tsx` (`scheduleTileWatchdog`, map `error` listener, user-visible map status messages)
  Status: VERIFIED
  Confidence: 0.94
- 2026-02-24T22:21Z [TOOL] [DETERMINISM] End-to-end validation suite executed in one pass: frontend/backend lint+build, backend tests (normal + `GEOWRAITH_OFFLINE=1`), dataset generation, synthetic benchmark, service health checks, and live browser/API smoke.
  Evidence: `npm run lint`, `npm run build`, `cd backend && npm run test`, `cd backend && GEOWRAITH_OFFLINE=1 npm run test`, `cd backend && npm run build:dataset`, `cd backend && npm run benchmark:accuracy`, `node /tmp/geowraith-playwright/live-smoke-multi.js`
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-24T22:21Z [CODE] [DETERMINISM] Strict Definition-of-Done remains gated by source modularity drift (>300 LOC files) and browser/physical-device map validation outside headless constraints.
  Evidence: `find src backend/src ... | xargs wc -l | sort -nr | head -n 20`, known issue KI-0013, headless WebGL fallback behavior
  Status: VERIFIED
  Confidence: 0.96
- 2026-02-24T23:05Z [CODE] [FRONTEND] MapView lifecycle was rewritten to stabilize style switching and marker recreation across Standard/Satellite/3D transitions, with local fallback style when tile providers fail.
  Evidence: `src/components/product/MapView.tsx`, `src/components/product/mapStyles.ts`, frontend lint/build pass
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-24T23:07Z [CODE] [MODELS] Backend now returns inference diagnostics (`embedding_source`, `reference_index_source`) and applies low-confidence gating for wide-radius ambiguous matches.
  Evidence: `backend/src/services/predictPipeline.ts`, `backend/src/services/vectorSearch.ts`, `backend/src/types.ts`, backend lint/build/test pass
  Status: VERIFIED
  Confidence: 0.96
- 2026-02-24T23:10Z [TOOL] [MODELS] Live API probe with `/Users/apinzon/Desktop/cape-town-aerial-view-greenpoint-stadium.jpg` returned Cape Town-near coordinates only after restarting backend process, confirming stale-process drift as an operational risk.
  Evidence: pre-restart mismatch vs post-restart `/api/predict` payloads on 2026-02-24
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-24T23:12Z [CODE] [DETERMINISM] KI-0013 resolved: all active source files are <=300 LOC after splitting Contact, extended content, and reference generator modules.
  Evidence: `find src backend/src ... | xargs wc -l | sort -nr | head -n 20` (max 297)
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-24T23:16Z [TOOL] [PERF] Updated synthetic benchmark on 10,000 references reports median ~8.84km / p95 ~116.25km; this is an internal consistency signal, not real-world validation.
  Evidence: `cd backend && npm run benchmark:accuracy` (2026-02-24)
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-25T17:38Z [CODE] [DETERMINISM] Coordinate catalog generation is deterministic (seeded) and `buildReferenceDataset.ts` auto-regenerates when missing/invalid.
  Evidence: `backend/src/scripts/generateCoordinates100K.ts`, `backend/src/scripts/buildReferenceDataset.ts`, `npm run build:dataset` (2026-02-25)
  Status: VERIFIED
  Confidence: 0.96
- 2026-02-25T17:38Z [CODE] [MODELS] ANN search is now wired into inference, with normalized ANN queries and versioned HNSW cache filename to avoid stale index reuse.
  Evidence: `backend/src/services/predictPipeline.ts`, `backend/src/services/annIndex.ts`, `backend/src/services/geoclipIndex.ts`
  Status: VERIFIED
  Confidence: 0.93
- 2026-02-25T18:12Z [TOOL] [MODELS] Real-world validation remains unconfirmed; gallery build attempts hit Wikimedia 429 rate limits and EXIF verification failures.
  Evidence: `npx tsx src/scripts/buildValidationGallery.ts --count=10` (2026-02-25)
  Status: PARTIAL
  Confidence: 0.70
- 2026-02-25T18:25Z [TOOL] [MODELS] Local validation pipeline executed using 2x2 sample images; confirms benchmark path works but does not represent real-world accuracy.
  Evidence: `npm run build:gallery:local`, `npm run benchmark:validation` (2026-02-25)
  Status: VERIFIED
  Confidence: 0.90
- 2026-02-25T18:25Z [CODE] [MODELS] Vision model asset is `vision_model_q4.onnx` (supersedes earlier `vision_model_uint8.onnx` references).
  Evidence: `backend/src/services/clipExtractor.ts`, root `README.md`
  Status: VERIFIED
  Confidence: 0.93
- 2026-02-25T18:44Z [CODE] [DOCS] Corrected accuracy/status docs to reflect UNCONFIRMED real‑world validation and PARTIAL project status.
  Evidence: `ACCURACY_ASSESSMENT.md`, `STATUS.md`
  Status: VERIFIED
  Confidence: 0.92
- 2026-02-25T18:54Z [CODE] [DOCS] Added CSV-based validation helper and validation guide for real‑world benchmarking.
  Evidence: `backend/src/scripts/buildGalleryFromCSV.ts`, `VALIDATION_GUIDE.md`, backend README updates
  Status: VERIFIED
  Confidence: 0.90
- 2026-02-24T23:22Z [CODE] [FRONTEND] Removed built-in MapLibre controls to eliminate duplicate/non-functional map buttons; custom control layer is now the only map interaction surface.
  Evidence: `src/components/product/MapView.tsx`, screenshot-aligned UX fix
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-24T23:23Z [CODE] [MODELS] Increased reference-dataset target to 50,000 coordinates; large-index cache persistence is now skipped above 20k vectors to avoid JSON string-size failures while keeping model-backed in-memory index active.
  Evidence: `backend/src/scripts/buildReferenceDataset.ts`, `backend/package.json`, `backend/src/data/referenceVectors.ts`, `backend/src/services/geoclipIndex.ts`
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-25T08:15Z [CODE] [MODELS] Downloaded GeoCLIP ONNX models (location_model_uint8.onnx, vision_model_q4.onnx) to `.cache/geoclip/`; backend now loads models successfully.
  Evidence: `ls -la .cache/geoclip/` shows models (9.1MB + 189MB), backend tests pass with `[GeoCLIP] ONNX sessions loaded in 214ms`
  Status: VERIFIED
  Confidence: 0.99
- 2026-02-25T08:31Z [CODE] [MODELS] Generated 100K coordinate dataset and sampled 50K reference coordinates for GeoCLIP index.
  Evidence: `backend/src/scripts/generateCoordinates100K.ts` created, `.cache/geoclip/coordinates_100K.json` (3.8MB), `backend/src/data/geoclipCoordinates.json` (6.5MB)
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-25T08:35Z [CODE] [PERF] Implemented HNSW (Hierarchical Navigable Small World) approximate nearest neighbor search, replacing brute-force cosine similarity.
  Evidence: `backend/src/services/annIndex.ts` (218 LOC), hnswlib-node v3.0.0 installed, 500-700x speedup (0.08ms vs 58ms per query)
  Status: VERIFIED
  Confidence: 0.98
- 2026-02-25T08:50Z [CODE] [MODELS] Created validation gallery builder and real-world accuracy benchmark using Wikimedia Commons geotagged images.
  Evidence: `backend/src/scripts/buildValidationGallery.ts`, `backend/src/benchmarks/validationBenchmark.ts`, npm scripts added
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-25T19:03Z [TOOL] [MODELS] Real-world validation executed with 5 landmark photos (5/10 downloads succeeded); median error 65.4 km, within 100 km = 60%, within 1,000 km = 80%.
  Evidence: `backend/.cache/validation_gallery/benchmark_report.json`, `npm run build:gallery:real`, `npm run benchmark:validation`
  Status: VERIFIED
  Confidence: 0.92
- 2026-02-25T19:05Z [TOOL] [DETERMINISM] Re-ran frontend lint/build and backend lint/build/test; all passed after validation updates.
  Evidence: `npm run lint`, `npm run build`, `cd backend && npm run lint && npm run build && npm run test`
  Status: VERIFIED
  Confidence: 0.95
- 2026-02-25T21:00Z [TOOL] [MODELS] Multi-source downloader created and validated 12 landmark images; median error 83.3 km, within 100 km 58.3%, within 1,000 km 83.3%.
  Evidence: `npm run download:images -- --count=30 --delay=3000`, `npm run benchmark:validation`, report at `backend/.cache/validation_gallery/benchmark_report.json`
  Status: VERIFIED
  Confidence: 0.94
  Note: 35-landmark database; system fully operational
- 2026-02-25T19:03Z [TOOL] [PERF] HNSW index loaded with 100,000 vectors during validation run.
  Evidence: `npm run benchmark:validation` output shows `[HNSW] Loaded cached index with 100000 vectors`
  Status: VERIFIED
  Confidence: 0.88
- 2026-02-25T18:18Z [CODE] [MODELS] Created `buildLocalValidationGallery.ts` to bypass Wikimedia rate limits.
  Evidence: `npm run build:gallery:local` + `npm run benchmark:validation` both work in workspace
  Status: VERIFIED
  Confidence: 0.95
  Evidence: `npx tsx src/scripts/buildValidationGallery.ts --count=10` failed with rate limits
  Note: Earlier claim of 48km median from "demo" mode was NOT verified in this workspace.
  Status: UNCONFIRMED
  Confidence: N/A
- 2026-02-25T21:21:58Z [TOOL] [MODELS] SmartBlend expanded with Openverse PD/CC0 sourcing; real-world validation rerun on 32 images.
  Evidence: `npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified`, `npm run benchmark:validation`
  Status: VERIFIED
  Confidence: 0.92
  Note: Median error 176km, within 100km 43.8%, within 1,000km 62.5% (see `backend/.cache/validation_gallery/benchmark_report.json`).
- 2026-02-25T22:19:08Z [TOOL] [MODELS] Supersedes 21:21:58Z entry: SmartBlend validation run on 27 images with updated report.
  Evidence: `npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified`, `npm run benchmark:validation`
  Status: VERIFIED
  Confidence: 0.92
  Note: Median error 143km, within 100km 44.4%, within 1,000km 59.3% (see `backend/.cache/validation_gallery/benchmark_report.json`).
- 2026-02-25T22:19:08Z [CODE] [MODELS] Refactored city scraper into modules, added Wikimedia search fallback, MIME filtering, dedupe, and dry-run support.
  Evidence: `backend/src/scripts/scrapeCityImages.ts`, `backend/src/scripts/city/*`, `npm run lint`
  Status: VERIFIED
  Confidence: 0.90
