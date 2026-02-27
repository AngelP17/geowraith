# GeoWraith AGENTS.md

**Project:** GeoWraith v2.2 — Local-First Visual Geolocation  
**Stack:** TypeScript/React (Vite) + Node/Express (API stub)  
**Constraints:** Zero-cost hosting, deterministic builds, offline-capable, MIT license  
**Last Updated:** 2026-02-27

> **Quick Links:** [README](README.md) | [Architecture](ARCHITECTURE.md) | [Status](STATUS.md) | [Known Issues](knowissues.md)

---

## Build, Lint & Test Commands

### Frontend (root)
```bash
npm run dev          # Start Vite dev server on port 3001
npm run build       # Production build to dist/
npm run lint        # TypeScript type check (tsc --noEmit)
npm run preview     # Preview production build
npm run clean       # Remove dist/
```

### Backend (cd backend)
```bash
cd backend
npm run dev         # Start API server on port 8080
npm run build       # Compile TypeScript to dist/
npm run lint        # TypeScript type check
npm run test        # Run all tests (tsx --test src/**/*.test.ts)

# Run a single test file
npm run test -- src/routes/predict.test.ts

# Run tests matching a pattern
npm run test -- --grep "health"

# Backend benchmarks
npm run benchmark:accuracy
npm run benchmark:search
npm run benchmark:validation
```

---

## Code Style Guidelines

### General
- **300 LOC max** per file (except generated/docs). Decompose large components into sub-components or hooks.
- Use **ES modules** (`import`/`export`, not CommonJS).
- Always use **strict TypeScript** (`strict: true` in tsconfig).

### Imports & Organization
- **Explicit imports only** — no barrel files (`index.ts`) unless for re-exports.
- Order: external libs → internal modules → local types → relative paths.
- Use path aliases defined in `tsconfig.json` (e.g., `@/` or `@backend/`).
- Example:
```ts
import { useState } from 'react';
import axios from 'axios';
import { config } from '../config.js';
import type { PredictResponse } from '../lib/api.ts';
```

### Naming Conventions
- **Files:** kebab-case (`clipExtractor.ts`, `useMapRuntime.ts`)
- **Components:** PascalCase (`Hero.tsx`, `ProductUI.tsx`)
- **Hooks:** camelCase with `use` prefix (`useScrollProgress.ts`)
- **Types/Interfaces:** PascalCase (`PredictRequest`, `ConfidenceTier`)
- **Constants:** UPPER_SNAKE_CASE for runtime constants, PascalCase for config objects
- **Variables:** camelCase

### TypeScript Types
- Use **interfaces** for object shapes, **types** for unions/intersections.
- Always type function parameters and return values.
- Avoid `any` — use `unknown` if type is truly unknown, then narrow with type guards.
- Use `strict` mode — no implicit `any`.

### Error Handling
- **NEVER** use empty catch blocks:
```ts
// BANNED
try { /* ... */ } catch { /* ignore */ }
```
- **REQUIRED** — throw descriptive errors with context:
```ts
if (!payload) {
  throw new Error('missing payload: predictImage requires an image');
}
```
- Use custom error types for API errors:
```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
```
- Log errors with context before propagating:
```ts
catch (err) {
  console.error('[Service] Failed to extract embedding:', err);
  throw err;
}
```

### React Patterns
- Use **functional components** with hooks only.
- Colocate small components in a single file when tightly coupled.
- Extract reusable logic into custom hooks.
- Use `useCallback`/`useMemo` only when there's measurable perf benefit.
- Keep components under 200 lines; decompose larger ones.

### API/Express Patterns
- Return JSON only — never plain text or HTML (except `/health`).
- Validate input early; return 400 with clear error message:
```ts
if (!payload.image_base64 && !payload.image_url) {
  return res.status(400).json({ error: 'missing image payload' });
}
```
- Use middleware for cross-cutting concerns (logging, error handling).
- No silent failures — always log and return appropriate status codes.

### Formatting
- Use **2 spaces** for indentation (match project defaults).
- Max **100 characters** per line.
- Trailing commas in multi-line objects/arrays.
- Single quotes for strings (except where template literals needed).
- Always use semicolons.
- Format on save (editor config provided via `.editorconfig` if present).

---

## Determinism & Testing

Maintain `.agent/CONTINUITY.md` per global rules, with GeoWraith-specific sections.

### File Location and Read Order

- Location: `.agent/CONTINUITY.md` (single file per workspace).
- At the **start of each assistant turn**, read `.agent/CONTINUITY.md` *before* acting.
- Update it only when there is a **meaningful delta** in plans, decisions, state, or discoveries—never for transient thoughts.

### Memory Stack Integration

Use all three files together with clear roles:

- `.agent/CONTINUITY.md`: per-task operational continuity for the current and next turns.
- `Memory.md`: durable high-level memory (stable decisions, policy baselines, long-lived assumptions).
- `knowissues.md`: open/resolved known issues, risks, and drift gaps.

Update triggers:

- If a decision affects future behavior, update `.agent/CONTINUITY.md` and `Memory.md`.
- If a defect/risk is discovered or status changes, update `.agent/CONTINUITY.md` and `knowissues.md`.
- If an issue is resolved, mark it resolved in `knowissues.md` and add a superseding note in `Memory.md`.

### Sections and GeoWraith-Specific Tags

- **[DETERMINISM]:** Any change affecting build reproducibility
- **[ETHICS]:** Features touching authorization, logging, or data retention
- **[PERF]:** Benchmark results (latency, memory)
- **[MODELS]:** Model versions, input tensor shapes, preprocessing changes

These tags specialize the global sections (PLAN, DECISIONS, PROGRESS, DISCOVERIES, OUTCOMES). Use whichever combination makes an entry clearest.

### Formatting and Anti-Bloat Rules

- Every entry must include:
  - An ISO timestamp, e.g., `2026-01-13T09:42Z`
  - A provenance tag: `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`
  - `UNCONFIRMED` for any unverified fact.
- Keep the file **short and high-signal**:
  - Compress older items into milestone bullets when sections grow large.
  - No raw logs or transcripts; at most 1–3 lines of summarized evidence (tests, errors).
- When facts change, **supersede them explicitly** rather than editing history silently.

### Confidence and Drift-Control Requirements

For non-trivial technical/status claims, record:

- A confidence score in `0.00-1.00`
- A claim label: `VERIFIED`, `PARTIAL`, or `UNCONFIRMED`
- Supporting evidence (command/test/doc source and date)

Rules:

- `VERIFIED` requires direct evidence captured in the current task context.
- If required checks were not run, claim must be `PARTIAL` (never `VERIFIED`).
- If a fact cannot be confirmed, mark it `UNCONFIRMED`.
- Never claim "done/complete/ready" without explicit pass evidence for all applicable checks.

---

## API Design Standards

### Node/Express
- Return JSON only
- Validate input and return 400 with a clear error for invalid payloads
- No silent failures

---

## Security & Secrets

- Never print secrets (tokens, private keys, credentials) to terminal output or logs.
- Do not ask the user to paste secrets into the chat.
- Avoid broad environment dumps (`env`, `printenv`) unless filtered to non-sensitive variables.
- Use `.env.example` checked into git, never `.env` with real keys.

---

## Documentation Requirements

Every PR must update:

1. **Code comments** — TypeScript TSDoc (`/** */`) for exported functions
2. **README.md** — If adding features, updating build instructions, or changing env vars
3. **CONTINUITY.md** — State changes, decisions, discoveries
4. **Memory.md** — If durable decisions, assumptions, or workflow policies changed
5. **knowissues.md** — If any known issue/risk was added, updated, mitigated, or resolved

Graph standard for Markdown docs:

- Any diagram/graph embedded in Markdown must use Mermaid.js fenced blocks (```mermaid ... ```).
- Do not use image-only diagram exports when a textual Mermaid diagram can represent the same content.

---

## Prohibited Technologies

Do not introduce:
- **PostgreSQL/MySQL** — Use flat files only
- **Redis** — In-memory Node structures only
- **Kubernetes** — Not supported for this repo
- **Google Analytics/tracking pixels** — GeoWraith is surveillance-free
- **Non-MIT compatible licenses** — GPL, AGPL, CC-NC code cannot be merged

---

## Definition of Done (GeoWraith Extended)

A task is complete when:

- [ ] Frontend build passes on host (`npm run build`) using the workflows documented in `[README.md](README.md)`
- [ ] TypeScript lint passes on host (`npm run lint`)
- [ ] Unit tests pass if applicable (document the command used)
- [ ] No files >300 LOC (except docs/generated), and new code respects the modular architecture
- [ ] No empty catch blocks or silent failures
- [ ] `.agent/CONTINUITY.md` updated with decisions/discoveries that materially affect determinism, ethics, models, or deployment
- [ ] `Memory.md` updated for durable decisions/assumptions affected by the task
- [ ] `knowissues.md` updated for discovered/resolved risks, defects, or drift items
- [ ] README updated if user-facing changes or system design are impacted
- [ ] Ethics review passed (if applicable to surveillance potential), with any decisions captured under `[ETHICS]` in the continuity ledger
- [ ] Final task report includes status class (`VERIFIED`/`PARTIAL`/`UNCONFIRMED`), confidence score, and explicit list of unrun checks

---

## Emergency Contacts (Metaphorical)

- **Determinism issues:** Check `package-lock.json` and build scripts first
- **Model accuracy issues:** Verify test fixtures once added
- **Ethics concerns:** Flag immediately, do not merge

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Main project documentation |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, API contracts, models, pipelines |
| [STATUS.md](STATUS.md) | Current project status and component matrix |
| [knowissues.md](knowissues.md) | Known issues, gaps, and risks |
| [Memory.md](Memory.md) | Durable high-level memory of decisions |
| [.agent/CONTINUITY.md](.agent/CONTINUITY.md) | Task-by-task operational continuity |
| [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) | Real-world accuracy validation workflow |
| [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) | Production deployment guide |

**License:** MIT — You own what you build, but you are responsible for how it is used.

---

## Cursor Cloud specific instructions

### Services overview

| Service | Directory | Dev command | Port | Notes |
|---------|-----------|-------------|------|-------|
| Frontend (Vite/React) | `/workspace` | `npm run dev` | 3001 | Works standalone in Demo mode |
| Backend (Express API) | `/workspace/backend` | `npm run dev` | 8080 | Optional for live inference; frontend gracefully degrades without it |

Standard commands for lint, build, and test are documented in `README.md` under **Quick Start** and **Backend checks**.

### Backend `npm install` workaround

`onnxruntime-node@1.22.0` post-install script fails in this environment because it tries to download GPU (CUDA) binaries that don't match the Linux x64 host. The workaround:

```bash
cd backend
npm install --ignore-scripts
# Rebuild the native addons that actually need it:
cd node_modules/sharp && npm run install && cd ../..
npx node-gyp rebuild --directory=node_modules/hnswlib-node
cd node_modules/@xenova/transformers/node_modules/sharp && npm run install && cd ../../../..
```

The CPU-only ONNX runtime binaries (napi-v6) are bundled in the package and load correctly without the GPU install step.

### Running services

- **Frontend only (Demo mode):** `npm run dev` from repo root. No backend needed.
- **Both services:** Start backend first (`cd backend && npm run dev`), then frontend (`npm run dev` from root). Or use `./start.sh`.
- The backend health check is at `GET http://localhost:8080/health`.

### Gotchas

- No proxy in `vite.config.ts` — frontend makes direct fetch to `http://localhost:8080`. CORS is handled server-side.
- GeoCLIP model files (`backend/.cache/geoclip/`) are not in the repo. Without them, the backend falls back to CLIP-based text matching via `@xenova/transformers`. The CLIP model (`Xenova/clip-vit-base-patch32`) is auto-downloaded from HuggingFace on first backend startup and cached locally.
- `npm run lint` in both root and `backend/` runs `tsc --noEmit` (type checking only, no ESLint).
- **CLIP accuracy limitation**: Standard CLIP ViT-Base without geo-specific fine-tuning achieves limited city-level accuracy (~40-50% for distinctive landmark photos). To reach 95% city-level accuracy globally, the project needs a geo-specialized model (e.g., StreetCLIP, GeoCLIP with proper ONNX exports, or PIGEON) and/or a reference image database of geotagged photos.
