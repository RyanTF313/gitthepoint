import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { config } from "@/lib/config";
import { AppError } from "@/lib/api/errors";
import {
  assertRepoAccess,
  type RepoRecord,
} from "@/lib/repoRegistry";

export function requireApiSecret(request: Request) {
  if (!config.apiSecret) return;

  const header =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!header || !safeEqual(header, config.apiSecret)) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export function createAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function extractAccessToken(
  request: Request,
  bodyToken?: unknown,
): string {
  const header = request.headers.get("x-repo-token");
  if (header) return header;

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  if (typeof bodyToken === "string" && bodyToken) return bodyToken;

  throw new AppError("Missing repository access token", 401, "UNAUTHORIZED");
}

export function requireRepoAccess(
  repoId: string,
  accessToken: string,
): RepoRecord {
  return assertRepoAccess(repoId, accessToken);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
