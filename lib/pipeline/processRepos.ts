import { ingestRepo } from "../ingest";
import { chunkFiles } from "../chunking/chunkFile";
import { embedChunks } from "../embeddings/embedChunks";
import { storeEmbeddings } from "../vectorStore/storeEmbeddings";
import { createAccessToken } from "@/lib/api/auth";
import { registerRepo } from "@/lib/repoRegistry";
import { assertServerConfig, config } from "@/lib/config";
import { AppError } from "@/lib/api/errors";
import {
  completeProgress,
  failProgress,
  setProgress,
} from "@/lib/progress/progress";

export async function processRepo(repoUrl: string, id?: string) {
  assertServerConfig();

  try {
    const {
      id: repoId,
      files,
      structure,
      previews,
      repoUrl: normalizedUrl,
    } = await ingestRepo(repoUrl, id);

    setProgress(repoId, {
      stage: "chunking",
      percent: 45,
      message: "chunking files",
    });
    const chunks = chunkFiles(files);

    if (chunks.length === 0) {
      throw new AppError(
        "No supported source files found in this repository",
        400,
        "NO_FILES",
      );
    }

    if (chunks.length > config.maxChunks) {
      throw new AppError(
        `Repository produced too many chunks (max ${config.maxChunks})`,
        413,
        "TOO_MANY_CHUNKS",
      );
    }

    setProgress(repoId, {
      stage: "embedding",
      percent: 50,
      message: "starting embeddings",
    });
    const embedded = await embedChunks(chunks, repoId);

    setProgress(repoId, {
      stage: "storing",
      percent: 75,
      message: "storing embeddings",
    });
    await storeEmbeddings(repoId, embedded);

    const accessToken = createAccessToken();
    registerRepo({
      id: repoId,
      accessToken,
      repoUrl: normalizedUrl,
      chunkCount: chunks.length,
      structure,
      previews,
    });

    const result = {
      id: repoId,
      accessToken,
      chunkCount: chunks.length,
      expiresInMs: config.repoTtlMs,
    };

    completeProgress(repoId, "ingestion complete", result);
    return result;
  } catch (err) {
    if (id) {
      const message =
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? "Ingest failed"
            : "Ingest failed";
      failProgress(id, message);
    }
    throw err;
  }
}
