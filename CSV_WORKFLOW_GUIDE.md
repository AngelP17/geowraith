# CSV Workflow Guide

**Last Updated:** 2026-02-27

> **Quick Links:** [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) | [SmartBlend Guide](SMARTBLEND_GUIDE.md)

Use CSV workflows to run deterministic validation on your own labeled images.

---

## CSV Schema

Required columns:

- `filename`
- `lat`
- `lon`
- `label`

Optional:

- `accuracy_radius`

---

## Build and Benchmark

```bash
cd backend
npm run build:gallery:csv -- --images=<images_dir> --csv=<metadata_csv>
npm run benchmark:validation
```

Report artifact:

- `.cache/validation_gallery/benchmark_report.json`

