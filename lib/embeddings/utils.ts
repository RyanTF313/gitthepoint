export function estimateEmbeddingTokens(inputs: string[]) {
  // rough heuristic: 1 token ~ 4 chars
  return inputs.reduce((sum, s) => sum + Math.ceil(s.length / 4), 0);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
