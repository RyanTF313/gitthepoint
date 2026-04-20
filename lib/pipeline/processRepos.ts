import { ingestRepo } from "../ingest";
import { chunkFiles } from "../chunking/chunkFile";
import { embedChunks } from "../embeddings/embedChunks";
import { storeEmbeddings } from "../vectorStore/storeEmbeddings";

export async function processRepo(repoUrl: string) {
  const { id, files } = await ingestRepo(repoUrl);

  const chunks = chunkFiles(files);

  const embedded = await embedChunks(chunks);

  await storeEmbeddings(id, embedded);

  return {
    id,
    chunkCount: chunks.length,
  };
}