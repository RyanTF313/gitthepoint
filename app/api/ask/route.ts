import { NextResponse } from "next/server";
import {
  extractAccessToken,
  requireApiSecret,
  requireRepoAccess,
} from "@/lib/api/auth";
import { toErrorResponse } from "@/lib/api/errors";
import { getClientIp, rateLimit } from "@/lib/api/rateLimit";
import { requireRepoId, requireString } from "@/lib/api/validate";
import { config } from "@/lib/config";
import { askQuestion, type ChatTurn } from "@/lib/rag/askQuestion";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (item): item is ChatTurn =>
        !!item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }));
}

export async function POST(req: Request) {
  try {
    requireApiSecret(req);

    const ip = getClientIp(req);
    rateLimit(
      `ask:${ip}`,
      config.rateLimitAskPerMinute,
      60 * 1000,
      "Too many questions. Slow down and try again.",
    );

    const body = await req.json();
    const repoId = requireRepoId(body?.repoId);
    const question = requireString(body?.question, "question", 4000);
    const accessToken = extractAccessToken(req, body?.accessToken);
    requireRepoAccess(repoId, accessToken);

    const history = parseHistory(body?.history);
    const result = await askQuestion(repoId, question, history);

    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
