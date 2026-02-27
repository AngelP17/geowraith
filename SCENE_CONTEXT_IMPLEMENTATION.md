# Scene Context Implementation

**Last Updated:** 2026-02-27

Scene context is now integrated end-to-end to improve operator interpretation of confidence behavior.

> **Related Docs:** [ARCHITECTURE.md](ARCHITECTURE.md) | [STATUS.md](STATUS.md)

---

## Backend

- Types include:
  - `SceneType`: `landmark | nature | urban | rural | unknown`
  - `CohortHint`: `iconic_landmark | generic_scene`
- Classification logic:
  - `backend/src/services/sceneClassifier.ts`
- Response integration:
  - `backend/src/services/predictPipeline.ts`

Returned under `scene_context`:

- `scene_type`
- `cohort_hint`
- `confidence_calibration`

---

## Frontend

- API type wiring:
  - `src/lib/api.ts`
- UI component:
  - `src/components/product/SceneContextBadge.tsx`
- Results integration:
  - `src/components/product/ResultsPanel.tsx`

Current badge style is clean editorial (not tactical scanline-heavy).

---

## Validation Cohort Support

Benchmark cohort reporting is implemented in:

- `backend/src/benchmarks/validationBenchmark/geo.ts`
- `backend/src/benchmarks/validationBenchmark/runner.ts`
- `backend/src/benchmarks/validationBenchmark/index.ts`

This prevents aggregate metrics from masking generic-scene weaknesses.

