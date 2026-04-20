/* eslint-disable @typescript-eslint/no-explicit-any */
import { askQuestion } from "@/lib/rag/askQuestion";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { repoId, question } = await req.json();

    if (!repoId || !question) {
      throw new Error("repoId and question required");
    }

    const result = await askQuestion(repoId, question);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("ASK ERROR:", err);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
