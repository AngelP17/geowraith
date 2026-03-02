# Accuracy Roadmap

**Last Updated:** 2026-03-02

> **Dependencies:** [STATUS.md](STATUS.md) | [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) | [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md) | [knowissues.md](knowissues.md)

---

## Current Baseline

- 58-image benchmark
- 96.6% within 10km
- Remaining failures: Marrakech, Copacabana

## Near-Term Roadmap

1. Expand the holdout/OOD benchmark with non-overlapping imagery
2. Improve generic-scene disambiguation for Marrakech and Copacabana
3. Evaluate stronger geo-specialized embedding options
4. Keep cohort-split reporting and leakage checks as mandatory KPIs

## Long-Term Roadmap

1. Geo-specialized model upgrades for generic scene reliability
2. Expanded geographically balanced anchor corpus
3. Optional SfM refinement once enabled and validated
