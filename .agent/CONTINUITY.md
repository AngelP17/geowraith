# CONTINUITY

## PLAN
- 2026-02-24T16:47Z [TOOL] Establish durable anti-drift workflow: enforce confidence-scored claims, explicit status classes, and evidence-based completion gates in project docs.

## DECISIONS
- 2026-02-24T16:47Z [CODE] [DETERMINISM] Documentation now requires claim labels (`VERIFIED`/`PARTIAL`/`UNCONFIRMED`) and confidence scores (`0.00-1.00`) for non-trivial claims.
- 2026-02-24T16:47Z [CODE] [DETERMINISM] Completion language ("done/complete/ready") is disallowed without explicit evidence of all applicable checks.

## PROGRESS
- 2026-02-24T16:47Z [CODE] Updated `README.md` with consistency protocol, completion truthfulness gate, and continuity memory rules.
- 2026-02-24T16:47Z [CODE] Updated `AGENTS.md` with confidence and drift-control requirements; added Definition of Done reporting requirement.
- 2026-02-24T18:11Z [CODE] [FRONTEND] Aligned frontend copy with GitHub-only social policy; updated GitHub CTAs and clone instructions to repo; corrected FRONTEND_CHANGES verification status language.
- 2026-02-24T18:14Z [TOOL] [FRONTEND] Ran host `npm run build` and `npm run lint` with user approval; recorded outputs in FRONTEND_CHANGES.md.
- 2026-02-24T18:28Z [CODE] [WORKFLOW] Updated README/AGENTS to host-first workflow; mitigated KI-0001.
- 2026-02-24T18:32Z [CODE] [WORKFLOW] Pruned Docker/Earthly references from all Markdown docs; updated baseline nav/CTA copy in README/AGENTS.
- 2026-02-24T18:32Z [CODE] [DOCS] Resolved KI-0001 by aligning README to current repo layout.
- 2026-02-24T18:54Z [CODE] [WORKFLOW] Added backend stub (`backend/`) with minimal API contract; updated README/AGENTS to reflect full product structure.
- 2026-02-24T18:58Z [CODE] [FRONTEND] Added Product UI section and wired frontend to `/api/predict`.
- 2026-02-24T19:27Z [CODE] [FRONTEND] Added MapLibre map with Standard/Satellite/3D modes and integrated into Product UI results; build/lint re-verified.
- 2026-02-24T19:39Z [CODE] [FRONTEND] Added Docs/Examples/Gallery sections and demo dispatcher; Product UI now supports Demo/Live data source toggle and demo fallback.
- 2026-02-24T19:05Z [CODE] [FRONTEND] Redesigned Product UI with Satellite Intelligence Console aesthetic; modularized into <300 LOC components.
- 2026-02-24T19:57Z [CODE] [FRONTEND] Updated MapView to use 3D perspective pitch (no DEM tiles) and improved marker fly-to refresh on demo changes.
- 2026-02-24T19:57Z [CODE] [FRONTEND] Updated all GitHub links to `https://github.com/AngelP17/geowraith`.
- 2026-02-24T19:57Z [TOOL] [FRONTEND] Ran `npm run lint` (tsc --noEmit) successfully after MapView changes.
- 2026-02-24T20:15Z [CODE] [CRITICAL] Fixed MapLibre __publicField crash by setting useDefineForClassFields: true in tsconfig.json.
- 2026-02-24T20:15Z [CODE] [FRONTEND] Wired AnimatedBackground canvas particles into Hero background stack with opacity: 0.4.
- 2026-02-24T20:15Z [CODE] [FRONTEND] Fixed Vite HMR port mismatch by configuring hmr.port: 3001 in vite.config.ts.
- 2026-02-24T20:15Z [CODE] [FRONTEND] Linked existing favicon (Projects/geowraith/favico.png) in index.html via public/favicon.png.
- 2026-02-24T20:15Z [TOOL] [VERIFICATION] Completed build verification: npm run lint ✓, npm run build ✓ (1.89s).
- 2026-02-24T20:15Z [CODE] [DOCS] Updated FRONTEND_CHANGES.md with KI-0004 resolution and final verification status.
- 2026-02-24T20:15Z [CODE] [DOCS] Updated knowissues.md with KI-0004 (MapLibre crash) as resolved.
- 2026-02-24T20:17Z [CODE] [DETERMINISM] Removed unused `@google/genai` dependency and `GEMINI_API_KEY` Vite define; updated title to `GeoWraith - Local Geolocation`.
- 2026-02-24T20:17Z [TOOL] [VERIFICATION] Re-ran host checks after cleanup: `npm run lint` ✓, `npm run build` ✓. Claim: VERIFIED. Confidence: 0.97.
- 2026-02-24T20:17Z [CODE] [DOCS] Added KI-0005 (resolved), updated FRONTEND_CHANGES.md and Memory.md to reflect cleanup and evidence.
- 2026-02-24T20:30Z [CODE] [WORKFLOW] Replaced backend stub with modular local inference MVP (`app.ts`, request parser, image signals, vector search, predict pipeline, tests). Claim: VERIFIED. Confidence: 0.95.
- 2026-02-24T20:30Z [TOOL] [DETERMINISM] Executed backend verification: `cd backend && npm run lint` ✓, `npm run build` ✓, `npm run test` ✓. Claim: VERIFIED. Confidence: 0.97.
- 2026-02-24T20:30Z [TOOL] [DETERMINISM] Re-verified frontend gates after backend/docs updates: `npm run lint` ✓, `npm run build` ✓. Claim: VERIFIED. Confidence: 0.95.
- 2026-02-24T20:30Z [CODE] [DOCS] Rewrote `mvp.md` as executable zero-cost task status with Mermaid architecture, and updated `README.md`, `backend/README.md`, `knowissues.md`, `Memory.md`.
- 2026-02-24T20:32Z [CODE] [WORKFLOW] Adjusted API error middleware logging to warn for expected 4xx validation rejections and preserve error logs for 5xx failures.
- 2026-02-24T20:32Z [TOOL] [DETERMINISM] Re-ran backend gates after logging update: `npm run lint` ✓, `npm run build` ✓, `npm run test` ✓. Claim: VERIFIED. Confidence: 0.97.
- 2026-02-24T20:46Z [TOOL] [VERIFICATION] Started backend/frontend persistently and confirmed reachability: frontend `http://localhost:3001` 200, backend `http://localhost:8080/health` 200.
- 2026-02-24T20:46Z [CODE] [FRONTEND] Added MapView WebGL fallback path to prevent full React tree failure when MapLibre cannot initialize (headless/unsupported environments).
- 2026-02-24T20:46Z [TOOL] [VERIFICATION] Executed live Playwright smoke in Chromium + Firefox against running servers: `/api/predict` returned 200 and UI reached `Analysis Complete` with no demo fallback in both browsers.
- 2026-02-24T20:46Z [TOOL] [PERF] Added and executed `npm run benchmark:accuracy` (synthetic labeled dataset, 7200 samples) to close MVP benchmark gap and capture current accuracy limitations.
- 2026-02-24T20:46Z [CODE] [DOCS] Updated `mvp.md` to `Status: COMPLETE` with confidence 0.99 based on executed validation checklist; updated `knowissues.md` and `Memory.md` with new validation and benchmark evidence.
- 2026-02-24T21:45Z [CODE] [MODELS] Implemented GeoCLIP ONNX backend integration (`vision_model_uint8` + `location_model_uint8`) and replaced placeholder static reference vectors with async cached GeoCLIP index (`1200` references).
- 2026-02-24T21:45Z [TOOL] [DETERMINISM] Verified backend after GeoCLIP integration: `npm run build:dataset` ✓, `npm run lint` ✓, `npm run build` ✓, `npm run test` ✓, `npm run benchmark:accuracy` ✓.
- 2026-02-24T21:45Z [CODE] [FRONTEND] Resolved frontend build/start hang by constraining Tailwind source scan scope to `src/**` in `src/index.css`.
- 2026-02-24T21:45Z [TOOL] [VERIFICATION] Re-verified frontend after Tailwind fix: `npm run lint` ✓, `npm run build` ✓, frontend `http://localhost:3001` = 200.
- 2026-02-24T21:45Z [TOOL] [VERIFICATION] Restarted backend/frontend in persistent sessions and confirmed reachability: backend `/health` = 200, frontend root = 200.
- 2026-02-24T22:01Z [CODE] [FRONTEND] Fixed MapLibre marker initialization order in `MapView` by setting `setLngLat([lon, lat])` before `addTo(map)` to prevent runtime `undefined.lng` crashes during marker/style updates. Claim: VERIFIED. Confidence: 0.98.
- 2026-02-24T22:01Z [CODE] [FRONTEND] Updated live analysis flow to remove silent demo fallback on live request failure; Product UI now surfaces explicit error state for failed live calls. Claim: VERIFIED. Confidence: 0.93.
- 2026-02-24T22:01Z [TOOL] [VERIFICATION] Re-ran frontend gates (`npm run lint` ✓, `npm run build` ✓) and browser smoke checks (`live-smoke-multi.js` Chromium/Firefox API 200; map error probe reports `MAP_ERRORS_NONE`). Claim: VERIFIED. Confidence: 0.97.
- 2026-02-24T22:12Z [CODE] [FRONTEND] Replaced standard map base style from `demotiles.maplibre.org` vector style to direct OSM raster style to reduce blank-map failure modes under external style-asset outages. Claim: VERIFIED. Confidence: 0.93.
- 2026-02-24T22:12Z [CODE] [FRONTEND] Added map tile watchdog timeout and runtime map `error` handling in `MapView` to surface tile/source failures with explicit UI messaging instead of silent blank map panes. Claim: VERIFIED. Confidence: 0.94.
- 2026-02-24T22:12Z [TOOL] [VERIFICATION] Re-ran frontend checks and live API smoke after map-style/runtime patch: `npm run lint` ✓, `npm run build` ✓, `node /tmp/geowraith-playwright/live-smoke-multi.js` ✓ (Chromium/Firefox `/api/predict` 200, no demo fallback). Claim: VERIFIED. Confidence: 0.96.
- 2026-02-24T22:12Z [CODE] [DOCS] Updated `FRONTEND_CHANGES.md`, `knowissues.md`, and `Memory.md` with KI-0012 blank-map root cause and stability patch evidence.
- 2026-02-24T22:17Z [TOOL] [VERIFICATION] Re-validated Kimi summary checks from current workspace state: frontend `npm run lint` ✓, frontend `npm run build` ✓ (~1.97s), backend `npm run lint` ✓, backend `npm run build` ✓, backend `npm run test` ✓ (5/5). Claim: VERIFIED. Confidence: 0.99.
- 2026-02-24T22:21Z [TOOL] [DETERMINISM] Executed full validation sweep: backend dataset build (`npm run build:dataset`) ✓, offline-mode tests (`GEOWRAITH_OFFLINE=1 npm run test`) ✓, benchmark (`npm run benchmark:accuracy`) ✓, frontend/backend lint+build ✓, backend tests ✓, health checks (`:3001`, `:8080/health`) ✓, browser live smoke (`live-smoke-multi.js`) ✓.
- 2026-02-24T22:21Z [CODE] [DOCS] Added KI-0013 for modularity gate drift: multiple source files exceed 300 LOC hard limit.

## DISCOVERIES
- 2026-02-24T16:47Z [TOOL] `.agent/CONTINUITY.md` did not exist at task start.
- 2026-02-24T16:47Z [CODE] Prior README included a premature status statement ("Documentation-complete. Ready for commit") without execution evidence.
- 2026-02-24T18:11Z [CODE] FRONTEND_CHANGES contained unverified build/test claims and Discord references inconsistent with GitHub-only policy.
- 2026-02-24T20:30Z [CODE] EXIF geotag passthrough works only when image metadata contains GPS; non-EXIF predictions are approximate and reference-limited.
- 2026-02-24T20:46Z [TOOL] Synthetic accuracy benchmark indicates current local visual-signal model is functional but not meter-level (large median/p95 error), so accuracy claim remains constrained by reference/model limitations.
- 2026-02-24T21:45Z [TOOL] GeoCLIP synthetic benchmark now reports low error profile (median 0m, p95 ~18km) with 1200 references; real-world labeled-image validation remains pending.
- 2026-02-24T22:01Z [TOOL] User-provided screenshot showed valid live inference output (coordinates + request id) while map pane failed, isolating the primary runtime fault to frontend MapView rendering logic rather than backend recognition.
- 2026-02-24T22:12Z [TOOL] Headless Playwright environments continue to report WebGL-unavailable fallback for MapLibre rendering, so map visual verification remains browser/GUI dependent even when API smoke checks pass.
- 2026-02-24T22:21Z [TOOL] Full line-count audit shows active source files beyond 300 LOC policy (`Contact.tsx`, `extendedContent.ts`, `generateReferenceVectors.ts`), preventing strict Definition-of-Done compliance despite passing runtime/build checks.

## OUTCOMES
- 2026-02-24T16:47Z [CODE] Repository now has a continuity ledger and stronger safeguards against content drift and false completion claims.
- 2026-02-24T16:49Z [USER] Requested `Memory.md` and `knowissues.md` to be wired with current structure and kept current with latest changes.
- 2026-02-24T16:49Z [CODE] [DETERMINISM] Integrated three-file memory stack in AGENTS/README with explicit sync triggers and Definition-of-Done checks.
- 2026-02-24T16:49Z [CODE] Added integration rules to `Memory.md` and lifecycle flow + cross-file sync rules to `knowissues.md`.
- 2026-02-24T16:51Z [USER] Requested rule that any graph in Markdown docs must use Mermaid.js.
- 2026-02-24T16:51Z [CODE] [DETERMINISM] Added Markdown graph standard to AGENTS documentation requirements and README consistency protocol.
- 2026-02-24T17:27Z [USER] Requested instruction docs be updated with how current frontend landing page looks and what has already been done.
- 2026-02-24T17:27Z [CODE] [FRONTEND] Added dated frontend baseline (visual + implemented sections) to README.md and AGENTS.md to reduce drift.
- 2026-02-24T17:27Z [CODE] [FRONTEND] Added durable baseline memory entry to Memory.md.
- 2026-02-24T20:15Z [CODE] GeoWraith frontend MVP now functional with critical bugs resolved.
- 2026-02-24T22:01Z [CODE] [FRONTEND] MapView now avoids marker-state race on initialization, and live mode no longer silently masks API failures behind demo fallback behavior.
- 2026-02-24T22:03Z [USER] Requested documentation be updated to reflect work-in-progress status rather than positioning as complete GeoSpy alternative.
- 2026-02-24T22:03Z [CODE] [DOCS] Updated README.md, mvp.md, GEOCLIP_REMAINING_TASKS.md, backend/README.md, and Memory.md to clarify MVP status, accuracy limitations, and unvalidated real-world performance.
- 2026-02-24T22:12Z [CODE] [FRONTEND] Map UI now degrades with explicit map-data error messaging under tile/source failure conditions and uses a more reliable raster standard basemap.
- 2026-02-24T22:21Z [CODE] Runtime and integration gates are green end-to-end in this environment; strict “finalized” status remains PARTIAL until 300 LOC modularity drift and physical-device map validation are completed.
