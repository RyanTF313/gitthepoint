function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  apiSecret: process.env.API_SECRET ?? "",
  chromaUrl: process.env.CHROMA_URL ?? "http://localhost:8000",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  maxZipBytes: intEnv("MAX_ZIP_BYTES", 50 * 1024 * 1024),
  maxFileBytes: intEnv("MAX_FILE_BYTES", 512 * 1024),
  maxFiles: intEnv("MAX_FILES", 2000),
  maxTotalChars: intEnv("MAX_TOTAL_CHARS", 5_000_000),
  maxChunks: intEnv("MAX_CHUNKS", 5000),
  repoTtlMs: intEnv("REPO_TTL_MS", 24 * 60 * 60 * 1000),
  rateLimitIngestPerHour: intEnv("RATE_LIMIT_INGEST_PER_HOUR", 10),
  rateLimitAskPerMinute: intEnv("RATE_LIMIT_ASK_PER_MINUTE", 30),
  rateLimitSummaryPerMinute: intEnv("RATE_LIMIT_SUMMARY_PER_MINUTE", 10),
  rateLimitContactPerHour: intEnv("RATE_LIMIT_CONTACT_PER_HOUR", 5),
};

export function assertServerConfig() {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
}
