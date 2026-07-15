import { createHash, timingSafeEqual } from "crypto";
import { config } from "@/lib/config";
import { AppError } from "@/lib/api/errors";
import { deleteCollection } from "@/lib/vectorStore/chroma";

export type FilePreview = {
  file: string;
  snippet: string;
  startLine: number;
  endLine: number;
};

export type RepoRecord = {
  id: string;
  accessTokenHash: string;
  repoUrl: string;
  chunkCount: number;
  structure: string[];
  previews: FilePreview[];
  createdAt: number;
  expiresAt: number;
};

const repos = new Map<string, RepoRecord>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, record] of repos) {
    if (record.expiresAt <= now) {
      repos.delete(id);
      void deleteCollection(id);
    }
  }
}

export function registerRepo(input: {
  id: string;
  accessToken: string;
  repoUrl: string;
  chunkCount: number;
  structure: string[];
  previews: FilePreview[];
}): RepoRecord {
  purgeExpired();

  const record: RepoRecord = {
    id: input.id,
    accessTokenHash: hashToken(input.accessToken),
    repoUrl: input.repoUrl,
    chunkCount: input.chunkCount,
    structure: input.structure,
    previews: input.previews,
    createdAt: Date.now(),
    expiresAt: Date.now() + config.repoTtlMs,
  };

  repos.set(input.id, record);
  return record;
}

export function getRepo(repoId: string): RepoRecord | undefined {
  purgeExpired();
  const record = repos.get(repoId);
  if (!record) return undefined;
  if (record.expiresAt <= Date.now()) {
    repos.delete(repoId);
    return undefined;
  }
  return record;
}

export function assertRepoAccess(
  repoId: string,
  accessToken: string,
): RepoRecord {
  const record = getRepo(repoId);
  if (!record) {
    throw new AppError(
      "Repository not found or expired. Please ingest again.",
      404,
      "REPO_NOT_FOUND",
    );
  }

  const provided = Buffer.from(hashToken(accessToken));
  const expected = Buffer.from(record.accessTokenHash);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new AppError("Invalid repository access token", 403, "FORBIDDEN");
  }

  return record;
}

export function deleteRepoRecord(repoId: string) {
  repos.delete(repoId);
}
