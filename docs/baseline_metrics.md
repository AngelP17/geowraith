# GeoWraith Benchmark Timeline

**Last Updated:** 2026-02-27  
**Purpose:** Preserve historical benchmark progression and prevent claim drift.

> **Canonical References:** [STATUS](../STATUS.md) | [Validation Guide](../VALIDATION_GUIDE.md) | [Reproducibility Playbook](./REPRODUCIBILITY_PLAYBOOK.md)

---

## Timeline

| Date | Dataset | Within 10km | Key Note |
|------|---------|-------------|----------|
| 2026-02-27 | 58-image gallery | 86.2% | Pre-hardening baseline in latest cycle |
| 2026-02-27 | 58-image gallery | 91.4% | Continent-vote/constraint improvements |
| 2026-02-27 | 58-image gallery | 93.1% | Targeted anchor refinement |

Current accepted benchmark snapshot:

- **93.1% within 10km** on 58 images
- `iconic_landmark`: **100.0%**
- `generic_scene`: **88.9%**

---

## Remaining Failure Set

Persistent hard cases in current gallery:

1. Marrakech Medina
2. Cape Point
3. Copacabana
4. Table Mountain

These are generic-scene disambiguation failures and should be tracked separately from iconic-landmark performance.

---

## Reporting Policy

When updating this file:

- include exact command used
- include model mode (GeoCLIP ONNX vs CLIP fallback)
- include dataset size
- include cohort split
- store benchmark report artifact path

