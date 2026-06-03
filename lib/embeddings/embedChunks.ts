/* eslint-disable @typescript-eslint/no-explicit-any */
import { Chunk } from "@/app/types";
import { openaiClient as client } from "@/lib/openai/client";
import { withRetry } from "@/lib/utils/retry";
import { estimateEmbeddingTokens, sleep } from "@/lib/embeddings/utils";

export async function embedChunks(chunks: Chunk[], repoId?: string) {
  // ⚠️ Batch for speed + cost efficiency
  const BATCH_SIZE = 25;

  const results = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const MAX_CHARS_SAFE = 6000; // ~buffer under 8192 tokens
    // console.log({ batch });
    const validPairs = batch
      .map((c) => {
        if (!c.content || typeof c.content !== "string") return null;

        let content = c.content;

        if (content.length > MAX_CHARS_SAFE) {
          content = content.slice(0, MAX_CHARS_SAFE);
        }

        return {
          chunk: c,
          input: `File: ${c.file}\nLines: ${c.startLine}-${c.endLine}\n${content}`,
        };
      })
      .filter((x): x is { chunk: (typeof batch)[number]; input: string } =>
        Boolean(x),
      );

    try {
      const inputs = validPairs.map((p) => p.input);

      const estimatedTokens = estimateEmbeddingTokens(inputs);
      // eslint-disable-next-line no-console
      console.log(`Embedding batch ${i / BATCH_SIZE} - items ${inputs.length} - est tokens ${estimatedTokens}`);

      const res = await withRetry(() =>
        client.embeddings.create({
          model: "text-embedding-3-small",
          input: inputs,
        }),
      );

      if (repoId) {
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
        const percent = 50 + Math.round((batchIndex / totalBatches) * 25); // map to 50-75
        // lazy import to avoid cycles
        const { setProgress } = await import("@/lib/progress/progress");
        setProgress(repoId, { stage: "embedding_batch", percent, message: `embedding batch ${batchIndex}/${totalBatches}` });
      }

      for (let j = 0; j < validPairs.length; j++) {
        results.push({
          ...validPairs[j].chunk,
          embedding: res.data[j].embedding,
        });
      }
    } catch (err: any) {
      console.error("EMBED ERROR:", err?.message || err);
      throw err;
    }
    // inter-batch delay to avoid TPM spikes
    const batchDelay = Number(process.env.EMBEDDING_BATCH_DELAY_MS || 1200);
    await sleep(batchDelay);
  }

  return results;
}
