Here is the **GeoWraith-specific `AGENTS.md`** — a drop-in file for `.codex/AGENTS.md` or repo root that inherits your global rules and adds project-specific constraints for the Rust/React stack, deterministic testing, and ethical use requirements.

# GeoWraith AGENTS.md

**Project:** GeoWraith v2.2 — Local-First Visual Geolocation  
**Stack:** TypeScript/React (Vite) + Node/Express (API stub)  
**Constraints:** Zero-cost hosting, deterministic builds, offline-capable, MIT license  
**Last Updated:** 2026-02-24

---

## How This File Relates to Global Guidance

This `AGENTS.md` is the **repo-local extension** of your global `~/.codex/AGENTS.md`.

- **Read order**: Read the global `~/.codex/AGENTS.md` first, then this file.
- **Scope**: Global guidance defines how Codex should behave everywhere; this file pins the GeoWraith-specific constraints for determinism, ethics, and stack choices.
- **Non-negotiables (from global rules)**:
  - Deterministic, reproducible builds and tests.
  - No destructive or write-capable remote API calls without explicit user approval and a dry-run.
  - Hard 300 LOC limit for code files (modular by default).
  - Continuity ledger must be maintained in `.agent/CONTINUITY.md`.

The **canonical end‑user and operator documentation** for this repo is `[README.md](README.md)`. When in doubt about commands, file layout, or workflows, prefer the README and keep this file focused on **agent behavior and guardrails**.

### Global Alignment: Accuracy, Recency, and Sourcing

When a task depends on *current* information (e.g., free tier hosting limits, latest crate versions, security advisories):

- Establish the current date/time in ISO format (e.g., via `date -Is`) and treat it as part of the answer.
- Prefer **official / primary sources**.
- Prefer the **most recent versioned docs**; when evaluating hosting options, confirm that a free tier still exists and **record the source and publish date** in your explanation.
- If you cannot verify a fact, mark it as **UNCONFIRMED** and avoid relying on it for critical decisions.

Web search (or Context7) is allowed **only when it materially improves correctness**, and the results must be summarized in your own words—never pasted in bulk.

---

## GeoWraith-Specific Mandates

### 1. Determinism Is Non-Negotiable

Every code change must preserve byte-for-byte reproducibility:

- **Node:** Lockfile must be committed (`package-lock.json`).

**Testing verification:**
- Use committed fixtures only if/when backend tests are introduced
- `GEOWRAITH_OFFLINE=1` must pass when implemented

The authoritative commands and workflows live in `[README.md](README.md)` (quick start, testing). Keep this file **policy-focused** and avoid diverging from the README’s command examples.

### 2. Host-First (Current)

Host-based workflows are the default for this repo.

```bash
# Frontend
npm install
npm run dev
npm run build
npm run lint

# Backend (stub)
cd backend
npm install
npm run dev
```

**If a task requires a new tool:** Document it in `[README.md](README.md)` and keep tooling choices consistent with the current repo setup.

### 3. Code Modularity (300 LOC Hard Limit)

GeoWraith uses aggressive modularization:

- **TypeScript:** Components over 300 lines must decompose into sub-components or hooks.
- **Backend:** Files over 300 lines must be split into modules.

**Exception:** Generated files and documentation.

#### Scope Control (Global Rule, GeoWraith-Tailored)

- Only modify files that are **directly required** by the current task.
- If a change would touch additional files (refactors, cleanups, “small improvements”), **list them and the reason** before editing and wait for explicit approval.
- Never rename, move, or delete files without an explicit user request.

### 4. Error Handling (Zero Tolerance for Silent Failures)

**Banned patterns:**
```ts
// BANNED
try { /* ... */ } catch { /* ignore */ }
```

**Required pattern:**
```ts
// REQUIRED
if (!payload) {
  throw new Error('missing payload');
}
```

Log errors with clear context before propagating. If you don't know how to handle it, let it bubble up—never swallow.

### 5. Ethical Use Guardrails

Every code contribution must respect:

- **No live camera ingestion** — Only analyze operator-uploaded static images
- **No tracking persistence** — Do not store session data, user IDs, or query logs beyond the HTTP request lifecycle
- **Explicit authorization checks** — Any batch processing feature must verify ownership of imagery

If implementing a feature that could enable surveillance (correlation across time, face detection, etc.), stop and flag for review. GeoWraith analyzes **places**, not people.

### 6. Zero-Cost Deployment Constraint

All code must run on free tiers:
- No Redis, no Postgres, no cloud-only services
- Static file serving only (no server-side rendering requirement)

---

## Project Structure Reference

```
./
├── src/                 # React app source
├── dist/                # Production build output
├── bg.mp4               # Hero background video
├── backend/             # API service (stub)
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

## Current Frontend Baseline (As of 2026-02-24)

Use this as the agent reference point to prevent drift between implementation and documentation.

- Hero style: dark cinematic landing with animated grid overlay and center-focused typography.
- Nav layout: centered `GEOWRAITH` logo with `Docs`, `Examples`, `Gallery`, `Contact`.
- Hero copy baseline:
  - Badge: `v2.2 | Fully Local | MIT Licensed`
  - Headline: `Meter-Level Geolocation from Any Photo`
  - CTAs: `Start Building`, `Learn More`
- Docs/Examples/Gallery are interactive and should scroll to live sections.
- Implemented landing flow in `src/App.tsx` includes:
  `Navbar`, `Hero`, `ProductUI`, `Docs`, `Examples`, `Gallery`, `WhatItIs`, `Features`, `UseCases`, `Industries`,
  `HowItWorks`, `Outcomes`, `Comparison`, `PrivacyDeepDive`,
  `TechStack`, `Pricing`, `FAQ`, `Contact`, `FinalCTA`, `Footer`.

When this baseline changes, update `README.md`, `Memory.md`, and `knowissues.md` as applicable in the same task.

---

## Testing Protocol

**Scope note:** The commands below apply only if the corresponding services/files exist in this workspace.

### Frontend Tests
```bash
npm run test  # If defined in package.json
```

---

## Continuity Ledger

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
