/** Clamp a numeric value between min and max bounds. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Compute cosine similarity for two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Normalize raw positive scores into probability-like weights. */
export function softmax(scores: number[], temperature = 1): number[] {
  if (scores.length === 0) return [];
  const scaled = scores.map((score) => score / Math.max(temperature, 1e-6));
  const max = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    const uniform = 1 / exps.length;
    return exps.map(() => uniform);
  }
  return exps.map((value) => value / total);
}
