# Ollama + LLM Verifier Setup

**Status:** Local verifier setup guide for the current pragmatic default  
**Last Updated:** 2026-03-02

> **Source of truth:** [README](README.md), [STATUS.md](STATUS.md), and [backend/src/config.ts](backend/src/config.ts)

---

## Current Recommendation

Use `qwen3.5:9b` as the default local verifier model on a 24GB M4 Mac.

Why:

- it fits comfortably enough to run alongside GeoCLIP
- it requires no code changes in the current Ollama integration
- it avoids the memory pressure that made `qwen3.5:27b` a poor practical default here

Current default in code:

```bash
GEOWRAITH_LLM_MODEL=qwen3.5:9b
```

---

## Install and Verify

```bash
brew install ollama
ollama serve
ollama pull qwen3.5:9b
curl http://localhost:11434/api/tags
```

The model should appear in `/api/tags` before you expect the verifier to run.

---

## Benchmark Command

```bash
cd backend
GEOWRAITH_USE_UNIFIED_INDEX=true \
GEOWRAITH_ENABLE_VERIFIER=true \
GEOWRAITH_LLM_MODEL=qwen3.5:9b \
npm run benchmark:validation
```

Current verified note:

- the verifier-enabled rerun with `qwen3.5:9b` did **not** improve the current `56/58` validation result

---

## Memory Check

Use the built-in preflight helper:

```bash
cd backend
npm run benchmark:safe
```

This now reports memory expectations based on the configured verifier model.

---

## Troubleshooting

**Model not found**

```bash
curl http://localhost:11434/api/tags
```

If the model is not listed, the verifier will be unavailable.

**Slow first verifier call**

- expected while Ollama loads the model into memory

**No benchmark improvement**

- that is currently the verified state; treat the verifier as experimental until a measured delta is demonstrated

---

## Environment Variables

```bash
GEOWRAITH_ENABLE_VERIFIER=true
GEOWRAITH_LLM_MODEL=qwen3.5:9b
GEOWRAITH_VERIFIER_TIMEOUT=30000
OLLAMA_ENDPOINT=http://localhost:11434
```
