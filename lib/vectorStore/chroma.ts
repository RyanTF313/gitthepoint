import { ChromaClient } from "chromadb";
import { config } from "@/lib/config";

let client: ChromaClient | null = null;

function getClient() {
  if (!client) {
    client = new ChromaClient({
      path: config.chromaUrl,
    });
  }
  return client;
}

export async function getOrCreateCollection(repoId: string) {
  return getClient().getOrCreateCollection({
    name: `repo-${repoId}`,
    // Use app-side embeddings instead of Chroma's OpenAI embedding function.
    embeddingFunction: null,
  });
}

export async function deleteCollection(repoId: string) {
  try {
    await getClient().deleteCollection({ name: `repo-${repoId}` });
  } catch (err) {
    console.error("Failed to delete Chroma collection:", err);
  }
}
