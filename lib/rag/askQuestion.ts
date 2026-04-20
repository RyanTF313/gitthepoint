import OpenAI from "openai";
import { getOrCreateCollection } from "@/lib/vectorStore/chroma";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function askQuestion(repoId: string, question: string) {
  // 1. Embed the query
  const embeddingRes = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const queryEmbedding = embeddingRes.data[0].embedding;

  // 2. Query Chroma
  const collection = await getOrCreateCollection(repoId);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
  });

  const docs = results.documents?.[0] || [];
  const metas = results.metadatas?.[0] || [];

  // 3. Format context
  const context = docs
    .map((doc, i) => {
      const meta = metas[i];
      return `File: ${meta?.file}\nLines: ${meta?.startLine}-${meta?.endLine}\n${doc}`;
    })
    .join("\n\n---\n\n");

  // 4. Ask LLM
  const response = await client.chat.completions.create({
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
        
        If the answer is not in the context, say you don’t know.`,
      },
      {
        role: "user",
        content: `Context: ${context} Question: ${question}`,
      },
    ],
  });

  return {
    answer: response.choices[0].message.content,
    sources: metas,
  };
}
