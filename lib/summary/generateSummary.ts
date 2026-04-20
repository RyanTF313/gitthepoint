import OpenAI from "openai";
import { getOrCreateCollection } from "../vectorStore/chroma";

interface ChunkMeta {
  file?: string;
  startLine?: number;
  endLine?: number;
  [key: string]: unknown;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateSummary(repoId: string) {
  const collection = await getOrCreateCollection(repoId);

  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: "project structure architecture entry points package.json README main files"
  });

  const queryEmbedding = res.data[0].embedding;

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 12,
  });

  const docs = (results.documents?.[0] || []) as (string | null)[];
  const metas = (results.metadatas?.[0] || []) as (ChunkMeta | null)[];

  const importantChunks: Array<{ doc: string | null; meta: ChunkMeta | null }> = [];
  const otherChunks: Array<{ doc: string | null; meta: ChunkMeta | null }> = [];

  docs.forEach((doc, i) => {
    const meta = metas[i];
    const file = meta?.file;

    if (file && typeof file === "string" && isImportantFile(file)) {
      importantChunks.push({ doc, meta });
    } else {
      otherChunks.push({ doc, meta });
    }
  });

  const finalChunks = [
    ...importantChunks.slice(0, 5), // always include these first
    ...otherChunks.slice(0, 7), // fill remaining slots
  ];


  const context = finalChunks
    .map(({ doc, meta }) => {
      return `File: ${meta?.file}
  Lines: ${meta?.startLine}-${meta?.endLine}
  ${doc}`;
    })
    .join("\n\n---\n\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer analyzing a codebase.

Explain clearly and concisely.`,
      },
      {
        role: "user",
        content: `Analyze this codebase and provide:

1. Architecture overview
2. Key modules and their roles
3. How data flows through the system
4. How to run the project (if possible)
5. Where a developer should start when making changes

Return your answer in this format:

## Architecture
...

## Key Modules
...

## Data Flow
...

## How to Run
...

## Where to Make Changes
...

If something is unclear or missing, say "Not sure from context".

Context:
${context}`,
      },
    ],
  });

  return completion.choices[0].message.content;
}

const isImportantFile = (file: string) => {
  return (
    file.includes("package.json") ||
    file.toLowerCase().includes("readme") ||
    file.match(/src\/index\.(ts|js|tsx|jsx)/) ||
    file.match(/app\.(ts|js|tsx|jsx)/)
  );
};
