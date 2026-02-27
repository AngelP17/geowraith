# Accuracy Roadmap

**Last Updated:** 2026-02-27

> **Dependencies:** [STATUS.md](STATUS.md) | [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) | [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md) | [knowissues.md](knowissues.md)

---

## Current Baseline

- 58-image benchmark
- 93.1% within 10km
- Remaining failures: Marrakech, Cape Point, Copacabana, Table Mountain

## Near-Term Roadmap

1. Hard-negative anchor curation for remaining 4 failures
2. Holdout/OOD benchmark (non-overlapping imagery)
3. Improve generic-scene disambiguation strategy
4. Keep cohort-split reporting as mandatory KPI

## Long-Term Roadmap

1. Geo-specialized model upgrades for generic scene reliability
2. Expanded geographically balanced anchor corpus
3. Optional SfM refinement once enabled and validated

