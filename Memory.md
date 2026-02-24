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
