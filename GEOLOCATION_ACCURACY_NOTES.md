# Geolocation Accuracy Notes

**Last Updated:** 2026-02-27  
**Status:** Archived working note; use [README](README.md), [STATUS](STATUS.md), and
[docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md) for canonical claims.

---

## Current Verified Snapshot

- Validation set: **58 images**
- Within 10km: **93.1%** (54/58)
- `iconic_landmark`: **100.0%** (22/22)
- `generic_scene`: **88.9%** (32/36)
- Remaining misses: Marrakech Medina, Cape Point, Copacabana, Table Mountain

These numbers are tied to the current GeoCLIP ONNX + anchor corpus in this workspace.

---

## Model Notes

- Preferred mode: GeoCLIP ONNX (`vision_model_q4.onnx`, `location_model_uint8.onnx`)
- Fallback mode: CLIP text matching via `@xenova/transformers`
- Last-resort mode: deterministic handcrafted image features

If GeoCLIP ONNX files are unavailable, do not expect the same 58-image benchmark result.

---

## Interpretation

- GeoWraith is strongest on iconic landmarks and scenes with strong regional cues.
- Generic urban, coastal, and nature scenes remain the weakest category.
- Standard CLIP fallback remains materially worse than GeoCLIP ONNX for city-level
  discrimination, especially on generic scenes.

---

## Claim Boundaries

- Safe claim: strong landmark geolocation with explicit withholding for weak matches
- Safe claim: 93.1% within 10km on the current 58-image validation gallery
- Unsafe claim: universal 95%+ accuracy across scene types
- Unsafe claim: meter-level precision from single-image inference alone

---

## Canonical References

- [README.md](README.md)
- [STATUS.md](STATUS.md)
- [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)
- [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md)
- [knowissues.md](knowissues.md)
