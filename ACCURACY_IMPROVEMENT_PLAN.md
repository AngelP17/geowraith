# Accuracy Improvement Plan (Current)

**Last Updated:** 2026-02-27

This file now tracks the active improvement loop aligned to the current benchmark snapshot.

> **Canonical References:** [STATUS.md](STATUS.md) | [docs/baseline_metrics.md](docs/baseline_metrics.md) | [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)

---

## Current Objective

Increase within-10km from **93.1%** to **95%+** on the 58-image validation gallery without hiding generic-scene weaknesses.

## Proven Effective

- Continent-vote hardening
- Targeted anchor refinement (`npm run refine:anchors`)
- Cohort split transparency (`iconic_landmark` vs `generic_scene`)

## Not Effective (So Far)

- Confuser-cap reduction alone
- Bulk street-level ingestion without viewpoint matching

## Active Workstream

1. Build targeted anchors for 4 hard failures
2. Validate against holdout set
3. Keep cohort metrics and hard-failure list in release reports

