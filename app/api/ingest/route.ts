/* eslint-disable @typescript-eslint/no-explicit-any */
import { processRepo } from "@/lib/pipeline/processRepos";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// fire-and-forget processing: return id immediately and process in background

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoUrl } = body;
    const jobId = uuidv4();

    // start background processing
    processRepo(repoUrl, jobId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Background processing error:", err);
    });

    return NextResponse.json({ ok: true, result: { id: jobId } }, { status: 200 });
  } catch (err: any) {
    // console.log(err)
    console.error("API ERROR:", err);
    console.error("MESSAGE:", err.message);

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
