import { NextResponse } from "next/server";
import {
  extractAccessToken,
  requireApiSecret,
  requireRepoAccess,
} from "@/lib/api/auth";
import { toErrorResponse } from "@/lib/api/errors";
import { requireRepoId } from "@/lib/api/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    requireApiSecret(req);

    const body = await req.json();
    const repoId = requireRepoId(body?.repoId);
    const accessToken = extractAccessToken(req, body?.accessToken);
    const record = requireRepoAccess(repoId, accessToken);

    return NextResponse.json({
      structure: record.structure,
      previews: record.previews,
      chunkCount: record.chunkCount,
      repoUrl: record.repoUrl,
      expiresAt: record.expiresAt,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
