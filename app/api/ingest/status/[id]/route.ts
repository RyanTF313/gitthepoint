import { NextRequest, NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/api/auth";
import { AppError, toErrorResponse } from "@/lib/api/errors";
import { getProgress } from "@/lib/progress/progress";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireApiSecret(request);

    const { id } = await params;
    if (!id) {
      throw new AppError("id is required", 400, "VALIDATION_ERROR");
    }

    const progress = getProgress(id);
    if (!progress) {
      throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
    }

    return NextResponse.json({
      ok: true,
      progress,
      result: progress.result,
      error: progress.error,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
