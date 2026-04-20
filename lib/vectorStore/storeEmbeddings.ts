import { v4 as uuidv4 } from "uuid";
import { getOrCreateCollection } from "./chroma";
import { EmbeddedChunk } from "@/app/types";

export async function storeEmbeddings(repoId: string, embeddedChunks: EmbeddedChunk[]) {
  const collection = await getOrCreateCollection(repoId);

  await collection.add({
    ids: embeddedChunks.map(() => uuidv4()),
    embeddings: embeddedChunks.map((c) => c.embedding),
    documents: embeddedChunks.map((c) => c.content),
    metadatas: embeddedChunks.map((c) => ({
      file: c.file,
      startLine: c.startLine,
      endLine: c.endLine,
      summaryHint: c.summaryHint,
    })),
  });
}