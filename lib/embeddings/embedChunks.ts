/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { Chunk } from "@/app/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function embedChunks(chunks: Chunk[]) {
  // ⚠️ Batch for speed + cost efficiency
  const BATCH_SIZE = 50;

  const results = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const MAX_CHARS_SAFE = 6000; // ~buffer under 8192 tokens

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
      const res = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: validPairs.map((p) => p.input),
      });

      for (let j = 0; j < validPairs.length; j++) {
        results.push({
          ...validPairs[j].chunk,
          embedding: res.data[j].embedding,
        });
      }
    } catch (err: any) {
      console.error("EMBED ERROR:", err.message);
      console.error("FULL ERROR:", err);
      throw err;
    }
  }

  return results;
}
