/* eslint-disable @typescript-eslint/no-explicit-any */
import { processRepo } from "@/lib/pipeline/processRepos";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoUrl } = body;
    const result = await processRepo(repoUrl);

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    console.error("API ERROR:", err);
    console.error("MESSAGE:", err.message);

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
