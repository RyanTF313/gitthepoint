/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateSummary } from "@/lib/summary/generateSummary";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { repoId } = await req.json();

    if (!repoId) {
      throw new Error("repoId required");
    }

    const summary = await generateSummary(repoId);

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("SUMMARY ERROR:", err);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}