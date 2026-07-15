import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireApiSecret } from "@/lib/api/auth";
import { toErrorResponse } from "@/lib/api/errors";
import { getClientIp, rateLimit } from "@/lib/api/rateLimit";
import { parseGitHubRepoUrl, requireString } from "@/lib/api/validate";
import { config } from "@/lib/config";
import { processRepo } from "@/lib/pipeline/processRepos";
import { initProgress } from "@/lib/progress/progress";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    requireApiSecret(request);

    const ip = getClientIp(request);
    rateLimit(
      `ingest:${ip}`,
      config.rateLimitIngestPerHour,
      60 * 60 * 1000,
      "Too many ingest requests. Try again later.",
    );

    const body = await request.json();
    const repoUrl = requireString(body?.repoUrl, "repoUrl", 500);
    const { url } = parseGitHubRepoUrl(repoUrl);

    const jobId = uuidv4();
    initProgress(jobId, "queued");

    // Fire-and-forget: client polls /api/ingest/status/[id]
    void processRepo(url, jobId).catch((err) => {
      console.error("Background processing error:", err);
    });

    return NextResponse.json(
      { ok: true, jobId, result: { id: jobId } },
      { status: 202 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
