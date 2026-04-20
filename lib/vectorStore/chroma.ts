import { ChromaClient } from "chromadb";

const client = new ChromaClient(
  {
    path: "http://localhost:8000",
  }
);

export async function getOrCreateCollection(repoId: string) {
  return client.getOrCreateCollection({
    name: `repo-${repoId}`,
    embeddingFunction: null, // use my embedding logic instead of chroma's built in (which calls OpenAI for each embed, very slow + costly)
  });
}
