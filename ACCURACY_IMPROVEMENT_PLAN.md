# Accuracy Improvement Plan (Current)

**Last Updated:** 2026-03-02

This file now tracks the active improvement loop aligned to the current benchmark snapshot.

> **Canonical References:** [STATUS.md](STATUS.md) | [docs/baseline_metrics.md](docs/baseline_metrics.md) | [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)

---

## Current Objective

Increase robustness beyond the current **96.6%** within-10km score on the 58-image validation
gallery without hiding generic-scene weaknesses or contaminating the benchmark corpus.

## Proven Effective

- Continent-vote hardening
- Targeted anchor refinement (`npm run refine:anchors`)
- Cohort split transparency (`iconic_landmark` vs `generic_scene`)
- Unified exact-search ranking fixes
- Confidence calibration for curated and refined-anchor recoveries

## Not Effective (So Far)

- Confuser-cap reduction alone
- Bulk street-level ingestion without viewpoint matching
- Simple preprocessing swaps alone (`none`, `jpeg-only`, `contain-224-jpeg`, `cover-224-jpeg`)
- Switching to the current CLIP city-text fallback profile

## Active Workstream

1. Expand the holdout set with non-overlapping generic scenes
2. Investigate stronger geo-specialized embedding options for Marrakech and Copacabana
3. Keep cohort metrics, benchmark-size disclosure, and leakage guards in release reports
