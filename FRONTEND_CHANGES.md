# Frontend Changes Log (Historical + Current Reference)

Early frontend migration logs are historical.

Current authoritative frontend state is documented in:

- [README.md](README.md)
- [STATUS.md](STATUS.md)
- [docs/REPRODUCIBILITY_PLAYBOOK.md](docs/REPRODUCIBILITY_PLAYBOOK.md)

Recent notable updates:

- Fixed black-map regression by using a fixed-height map viewport (`h-[500px]` with a
  full-size MapLibre mount).
- Replaced the transient style dropdown with persistent Standard, Satellite, and 3D mode
  buttons in the map header.
- Added a 2-second `style.load` completion fallback so mode switches do not stall when
  MapLibre never emits the event.
- Operator-safe mode now keeps the basemap visible while withheld targets remain hidden.
- Tabler-backed icon compatibility layer
- Geist + Satoshi typography system
- Hero visual refresh
- Scene context badge integration
- no-sparkle icon policy in frontend
