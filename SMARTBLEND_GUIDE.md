# SmartBlend Guide

**Last Updated:** 2026-02-27

> **Quick Links:** [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) | [CSV Workflow](CSV_WORKFLOW_GUIDE.md) | [Reproducibility Playbook](docs/REPRODUCIBILITY_PLAYBOOK.md)

SmartBlend is used to source and maintain anchor/validation imagery. For current benchmark reproduction, follow the validation guide first.

---

## Core Workflow

```bash
cd backend
npm run smartblend -- --min-images=30 --max-retries=3 --strategy=auto --seed=1337 --allow-unverified
npm run build:gallery:csv -- --images=.cache/smartblend_gallery/images --csv=.cache/smartblend_gallery/metadata.csv
npm run benchmark:validation
```

---

## Notes

- Keep sourced metadata with coordinates and labels.
- Track benchmark impact after any SmartBlend refresh.
- Do not merge SmartBlend changes without re-running validation.

