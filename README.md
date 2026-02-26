# GeoWraith v2.2

**Local-First • Open-Source Visual Geolocation Work in Progress**

GeoWraith is an experimental, local-first visual geolocation system exploring privacy-preserving approaches to image-based location inference.
No data leaves your machine. No external services are required after setup.

It aims to become a privacy-preserving, owner-controlled alternative to commercial platforms such as GeoSpy, but is currently a work-in-progress MVP with accuracy limitations.

---

## What This Is

GeoWraith is a **visual place recognition + geometric refinement system** composed of:

- A deterministic local inference and search core with GeoCLIP ONNX embeddings (MVP implemented)
- A local GeoCLIP reference index (50,000 sampled coordinates + in-memory index) (accuracy still requires real-world validation)
- Potential meter-level refinement using structure-from-motion (future research)
- A modern web interface (React/Vite/TypeScript)
- A host-first Node/Express API service for local inference

Everything runs locally. The network is optional and only used during initial data preparation, never during inference or testing.

---

## What This Is Not

- Not a tracking tool
- Not a surveillance service
- Not a cloud platform
- Not a consumer product

This is an engineering system intended for authorized, professional use only.

---

## Responsible Use (Non-Negotiable)

GeoWraith is designed for the same ethical and legal boundaries publicly advertised by GeoSpy:

**Allowed use cases:**
- Your own imagery
- Public-domain or Creative Commons imagery
- Authorized government, law-enforcement, or search-and-rescue work
- Verified OSINT on publicly available content

**Prohibited use:**
- Targeting private individuals without authorization
- Stalking, harassment, or covert monitoring
- Any use that violates local, state, or federal law

In California and many other jurisdictions, unauthorized geolocation of individuals constitutes criminal stalking and privacy violations.
The software does not enforce policy. Responsibility lies entirely with the operator.

GeoWraith:
- Never phones home
- Logs nothing by default
- Stores data only where you explicitly mount volumes

---

## Key Features

- **Modern React Frontend**
  Vite + React + TypeScript + Motion. Current implementation runs locally from the repo root.

- **Local Inference API**
  Express-based API with local GeoCLIP embedding, vector search, and coordinate aggregation for `/api/predict`.

- **Hybrid Demo Mode**
  Product UI can run in Demo mode (offline) or Live API mode (backend running).

- **Reproducible builds**
  Host-first workflow with `npm run build` and `npm run lint` as the standard checks.

- **Deterministic testing**
  Backend includes local API tests and host verification via lint/build/test commands.

- **Offline enforcement**
  Remote URL fetches are blocked in the backend local pipeline; `GEOWRAITH_OFFLINE=1` keeps strict local-only mode.

- **MIT license**
  Fork, audit, extend, deploy. Zero cost, fully open source.

---

## Current Repo Structure

```
./
├── src/                 # React app source
├── dist/                # Production build output
├── bg.mp4               # Hero background video
├── backend/             # API service (local inference MVP)
│   ├── src/
│   ├── docs/
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Quick Start (Under 60 Seconds)

### Option 1: One-Command Start (Both Services)

```bash
npm install
cd backend && npm install && cd ..
./start.sh
```

This starts both backend (port 8080) and frontend (port 3001) with live logs.
Press `Ctrl+C` to stop both services.

### Option 2: Manual Start

**Frontend:**
```bash
npm install
npm run dev
```

**Backend (separate terminal):**
```bash
cd backend
npm install
npm run dev
```

API will be available at `http://localhost:8080`.
Frontend at `http://localhost:3001/`.

Optional environment variables (see `backend/.env.example`):
- `MAPILLARY_ACCESS_TOKEN` enables Mapillary reference retrieval for `/api/predict/sfm`.
- `GEOWRAITH_ENABLE_SFM` controls whether `/api/predict/sfm` is active (`false` by default while SfM remains a staged update).
- `GEOWRAITH_OFFLINE`, `GEOWRAITH_API_PORT`, and `GEOWRAITH_MAX_IMAGE_BYTES` tune local runtime behavior.

**Backend checks:**
```bash
npm run lint
npm run build
npm run test
npm run benchmark:accuracy
npm run build:dataset
```

City dataset scrape example (multi-source fallback):
```bash
npm run scrape:city -- --city="Istanbul" --count=50 --sources=flickr,openverse,wikimedia
```

**Demo mode:** Demo and Live API are explicit operator modes. Live mode now surfaces request failures instead of silently switching to demo output.

---

## API Contract (Minimal)

`backend/docs/openapi.yaml` defines the contract for:

- `GET /health`
- `POST /api/predict`

The backend returns EXIF GPS coordinates when present, otherwise an approximate location from local GeoCLIP nearest-neighbor search.
Remote image URL fetches are blocked to preserve local-first operation.

GeoCLIP model-backed mode expects local assets in `backend/.cache/geoclip/`:
- `vision_model_q4.onnx`
- `location_model_uint8.onnx`
- `coordinates_100K.json` (for rebuilding coordinate samples)

---

## Demo Behavior

- **Docs/Examples/Gallery** sections are interactive and scroll to the Product UI.
- Examples and Gallery tiles trigger a demo result in the console.

## Current Limitations

- **Accuracy**: The synthetic benchmark shows promising results, but real-world accuracy on diverse imagery remains unvalidated. Meter-level precision is a target, not a current guarantee.
- **Reference Dataset**: Currently targets 50,000 sampled coordinates from GeoCLIP 100K; broader coverage and labeled-image validation are still in progress.
- **Offline Maps**: Map tiles require internet connectivity (offline tile caching not yet implemented).

---

## Current Frontend Baseline (As of 2026-02-24)

This is the documented baseline for the current landing-page implementation so future edits can avoid content drift.

### Visual Snapshot (Landing Hero)

- Dark, cinematic hero with animated grid overlay and center-focused composition.
- Brand mark `GEOWRAITH` centered in top navigation, with `Docs`, `Examples`, `Gallery`, `Contact` links.
- Badge above headline: `v2.2 | Fully Local | MIT Licensed`.
- Headline layout:
  - `Meter-Level`
  - `Geolocation` (emerald/cyan/blue gradient accent)
  - `from Any Photo`
- Subtitle emphasizes local-first operation and no data exfiltration.
- Primary CTAs: `Start Building` and `Learn More`.
- Scroll affordance at hero bottom (`Explore` indicator).

### Implemented Frontend Sections (Code-Verified)

Rendered in order by `src/App.tsx`:

1. `Navbar`
2. `Hero`
3. `ProductUI`
4. `Docs`
5. `Examples`
6. `Gallery`
7. `WhatItIs`
8. `Features`
9. `UseCases`
10. `Industries`
11. `HowItWorks`
12. `Outcomes`
13. `Comparison`
14. `PrivacyDeepDive`
15. `TechStack`
16. `Pricing`
17. `FAQ`
18. `Contact`
19. `FinalCTA`
20. `Footer`

### Baseline Claim Record

- Claim: Frontend landing page with the above hero look is implemented.
  - Status: `VERIFIED`
  - Confidence: `0.97`
  - Evidence: current React component code (`src/components/sections/Hero.tsx`, `src/components/Navbar.tsx`, `src/App.tsx`).

---

## Consistency and Drift-Control Protocol

To reduce content drift and false completion claims, use this reporting standard in docs, PR notes, and agent updates:

- **Claim classes:** mark statements as `VERIFIED`, `PARTIAL`, or `UNCONFIRMED`.
- **Confidence score:** attach a numeric score `0.00-1.00` to non-trivial claims.
- **Evidence required for `VERIFIED`:** include concrete command/test evidence (for example: `npm run build`, `npm run lint`, `npm run test` if present).
- **Recency rule:** for fast-changing facts (hosting tiers, package versions, advisories), include the exact verification date (ISO format).
- **No silent assumptions:** if data is missing, state `UNCONFIRMED` instead of inferring completion.
- **Diagram format standard:** any graph/diagram in Markdown must be authored as Mermaid.js (` ```mermaid ` blocks).

### Completion Truthfulness Gate

Do not state "complete", "done", "ready for commit", or equivalent unless all applicable checks were actually run and passed.

Use this minimum completion block:

```text
Status: PARTIAL | COMPLETE
Confidence: <0.00-1.00>
Evidence:
- <command/check 1 + result>
- <command/check 2 + result>
Not Run:
- <explicitly list skipped validations>
```

If any required check is not executed, status must be `PARTIAL`.

---

## Memory and Continuity

Maintain durable task memory in `.agent/CONTINUITY.md`:

- Read it at the start of each task.
- Append only meaningful decisions, discoveries, and superseding facts.
- Include ISO timestamps and provenance (`[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]`).
- Keep entries short and evidence-linked; no raw logs.

Use the repository memory stack together:

- `.agent/CONTINUITY.md`: task-by-task operational continuity and superseding facts.
- `Memory.md`: durable high-level memory of stable decisions and assumptions.
- `knowissues.md`: tracked known issues/risks with lifecycle status.

Synchronization rule:

- Decision changes: update `.agent/CONTINUITY.md` + `Memory.md`.
- Issue discovery/status change: update `.agent/CONTINUITY.md` + `knowissues.md`.
- Issue resolution: update all relevant docs and mark status `resolved` in `knowissues.md`.

---

## Contributing

1. Fork the repository
2. Add or update tests when applicable
3. Update docs that changed behavior/state: `README.md`, `.agent/CONTINUITY.md`, `Memory.md`, `knowissues.md`
4. Ensure `npm run build` and `npm run lint` pass

Pull requests that break determinism will not be accepted.

---

## License

MIT License.
You own what you build with it.

---

Made for ethical, local-first geospatial AI.
