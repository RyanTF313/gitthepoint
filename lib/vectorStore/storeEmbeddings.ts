import { v4 as uuidv4 } from "uuid";
import { getOrCreateCollection } from "./chroma";
import { withRetry } from "@/lib/utils/retry";
import { EmbeddedChunk } from "@/app/types";

export async function storeEmbeddings(repoId: string, embeddedChunks: EmbeddedChunk[]) {
  const collection = await getOrCreateCollection(repoId);
  const BATCH_SIZE = Number(process.env.CHROMA_BATCH_SIZE) || 5000;

  for (let i = 0; i < embeddedChunks.length; i += BATCH_SIZE) {
    const batch = embeddedChunks.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(embeddedChunks.length / BATCH_SIZE);

    // eslint-disable-next-line no-console
    console.log(`Storing batch ${batchIndex}/${totalBatches} (size=${batch.length}) to Chroma`);

    await withRetry(
      () =>
        collection.add({
          ids: batch.map(() => uuidv4()),
          embeddings: batch.map((c) => c.embedding),
          documents: batch.map((c) => c.content),
          metadatas: batch.map((c) => ({
            file: c.file,
            startLine: c.startLine,
            endLine: c.endLine,
            summaryHint: c.summaryHint,
          })),
        }),
      { attempts: 5, baseDelayMs: 1000 },
    );

    // eslint-disable-next-line no-console
    console.log(`Stored batch ${batchIndex}/${totalBatches} successfully`);
  }
}