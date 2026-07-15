import { getOrCreateCollection } from "@/lib/vectorStore/chroma";
import { getOpenAI } from "@/lib/openai/client";
import { withRetry } from "@/lib/utils/retry";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function askQuestion(
  repoId: string,
  question: string,
  history: ChatTurn[] = [],
) {
  const client = getOpenAI();

  const embeddingRes = await withRetry(() =>
    client.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    }),
  );

  const queryEmbedding = embeddingRes.data[0].embedding;
  const collection = await getOrCreateCollection(repoId);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
  });

  const docs = results.documents?.[0] || [];
  const metas = results.metadatas?.[0] || [];

  const context = docs
    .map((doc, i) => {
      const meta = metas[i];
      return `File: ${meta?.file}\nLines: ${meta?.startLine}-${meta?.endLine}\n${doc}`;
    })
    .join("\n\n---\n\n");

  const recentHistory = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content.slice(0, 4000),
  }));

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior software engineer helping explain a codebase.

When answering:
- Be specific about file locations
- Explain how things work, not just what
- If unsure, say so
- Suggest where to look next

If the answer is not in the context, say you don't know.`,
        },
        ...recentHistory,
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    }),
  );

  return {
    answer: response.choices[0].message.content,
    sources: metas,
  };
}
