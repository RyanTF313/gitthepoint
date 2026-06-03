import { ingestRepo } from "../ingest";
import { chunkFiles } from "../chunking/chunkFile";
import { embedChunks } from "../embeddings/embedChunks";
import { storeEmbeddings } from "../vectorStore/storeEmbeddings";
import { setProgress, completeProgress } from "@/lib/progress/progress";

export async function processRepo(repoUrl: string, id?: string) {
  const { id: repoId, files } = await ingestRepo(repoUrl, id);

  setProgress(repoId, { stage: "chunking", percent: 45, message: "chunking files" });
  const chunks = chunkFiles(files);

  setProgress(repoId, { stage: "embedding", percent: 50, message: "starting embeddings" });
  const embedded = await embedChunks(chunks, repoId);

  setProgress(repoId, { stage: "storing", percent: 75, message: "storing embeddings" });
  await storeEmbeddings(repoId, embedded);

  completeProgress(repoId, "ingestion complete");

  return {
    id: repoId,
    chunkCount: chunks.length,
  };
}