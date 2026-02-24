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
- Status: open | mitigated | resolved | wontfix
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
- Status: open
- Severity: medium
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: `src/components/product/MapView.tsx`, `mapStyles.ts`
- Description: MapLibre styles use public tile servers for standard/satellite/terrain views.
- Reproduction: Run frontend without internet; map tiles fail to load.
- Expected: Offline-capable map tiles or graceful offline fallback.
- Actual: External tile requests are required for standard/satellite; 3D uses perspective-only styling.
- Impact: Offline mode broken for map view.
- Workaround: Provide cached tiles or local tile server when implemented.
- Resolution: pending
- Evidence: `mapStyles.ts` references public tile URLs (2026-02-24).

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
- Status: mitigated
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
- Last Updated: 2026-02-24
- Area: `src/components/sections/contact/*`, `src/data/extendedContent*.ts`, `backend/src/data/generateReferenceVectors.ts`
- Description: Project policy defines a hard 300 LOC limit for code files (except docs/generated), but several committed source files exceed this threshold.
- Reproduction: `find src backend/src -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \\) -print0 | xargs -0 wc -l | sort -nr | head -n 20`
- Expected: All source files <=300 LOC unless generated/documentation exceptions apply.
- Actual: Largest active file is now `src/components/product/MapView.tsx` at 297 LOC; previously offending files were split.
- Impact: Violates modularity gate in project Definition of Done and increases maintenance complexity.
- Workaround: none
- Resolution: Split `Contact.tsx` into `sections/contact/*`, split `extendedContent.ts` into part files, and modularized `generateReferenceVectors.ts` with `worldCities.ts`.
- Evidence: line-count audit on 2026-02-24 shows all code files <=300 LOC.

## KI-0014: Running backend process can drift from latest local code
- Status: mitigated
- Severity: high
- First Seen: 2026-02-24
- Last Updated: 2026-02-24
- Area: local runtime operations (`backend` process lifecycle)
- Description: `npm run dev` for backend does not auto-watch/reload; long-lived process may keep serving old inference logic after code edits.
- Reproduction: Change `predictPipeline.ts`, then call existing `localhost:8080/api/predict` without restarting backend; response shape/behavior can still match old code.
- Expected: Live API behavior matches latest checked-out code.
- Actual: Stale process can continue serving old logic (example: old Algeria output remained until backend restart).
- Impact: False-negative validation and user-visible mismatch between claimed fixes and runtime behavior.
- Workaround: restart backend after backend code changes.
- Resolution: Mitigated operationally; full fix would require watch mode or managed restart script.
- Evidence: Live probe mismatch before restart and corrected Cape Town prediction after fresh backend start on 2026-02-24.

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
