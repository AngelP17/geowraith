# GeoWraith Endgame Architecture

**Status:** archival architecture note  
**Last Updated:** 2026-03-02

> **Canonical state:** [README](README.md), [STATUS.md](STATUS.md), and
> [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md)

---

## Verified Current State

- Clean unified validation baseline: **96.6%** within `10km` (`56/58`)
- Remaining hard failures: `Marrakech Medina`, `Copacabana Beach`
- Current pragmatic local verifier default: `qwen3.5:9b`
- Holdout benchmark path exists, but the current `11`-image seed set is too small for release-grade
  claims

---

## Active Multi-Source Reference System

Current validated unified corpus:

| Source | Count | Purpose |
|--------|-------|---------|
| Base corpus | 1,081 | Global landmark and anchor coverage |
| Mapillary | 350 | Street-level densification for failure zones |
| Synthetic | 37 | Geo-anchors for sparse regions |

Current densified regions:

- Marrakech
- Copacabana
- Table Mountain
- Cape Point

Even with that densification, the remaining misses are still retrieval/model problems rather than
simple coverage gaps.

---

## Verifier Path

Runtime verification remains optional:

```text
Stage 1: rule-based plausibility
Stage 2: CLIP-based verification heuristics
Stage 3: Ollama vision-language verification
```

Current local default:

```bash
GEOWRAITH_ENABLE_VERIFIER=true
GEOWRAITH_LLM_MODEL=qwen3.5:9b
```

Important:

- the verifier is wired
- the latest verifier-enabled rerun did not improve the clean `56/58` validation score
- it should still be treated as experimental

---

## What This Architecture Does Not Prove

This file should not be used to claim:

- production readiness
- `100%` benchmark accuracy
- verified verifier gains
- universal `95-98%` performance on arbitrary imagery

Those claims require fresh benchmark evidence from the canonical docs above.
