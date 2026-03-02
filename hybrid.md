# Hybrid Geolocation Accuracy Upgrade

**Status:** archived design and implementation context  
**Last Updated:** 2026-03-02

> **Canonical references:** [README](README.md), [STATUS.md](STATUS.md),
> [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md), and
> [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## Current Verified Snapshot

- Clean unified benchmark: **96.6% within 10km** (`56/58`)
- Cohorts:
  - `iconic_landmark`: **100.0%**
  - `generic_scene`: **94.4%**
- Remaining hard failures:
  - Marrakech Medina
  - Copacabana Beach
- Current pragmatic verifier model: `qwen3.5:9b`

---

## What Was Implemented

- universal image-format normalization with configurable preprocessing
- health, readiness, liveness, and metrics endpoints
- optional intelligence briefs and anomaly alerts
- contextual map layers and shareable report export
- unified multi-source reference index
- optional verifier pipeline via Ollama
- split frontend surface:
  - `/` marketing landing page
  - `/demo` Mission Console

---

## What We Learned

- adding validation images to the runtime corpus can create fake `100%` results through benchmark
  leakage; those numbers are invalid
- the current holdout path is useful, but the `11`-image seed set is still too small for strong
  release claims
- simple preprocessing swaps do not fix Marrakech or Copacabana
- the current CLIP city-text fallback is much worse than unified GeoCLIP on the validation set
- future accuracy work should focus on stronger geo-specialized embeddings and a larger honest
  holdout set, not more blind densification

---

## Current Recommendation

Use this file as historical context only. For current claims, commands, and benchmark numbers, use
the canonical references above.
