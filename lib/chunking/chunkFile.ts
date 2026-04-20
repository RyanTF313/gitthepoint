import { FileData, Chunk } from "@/app/types";

let MAX_CHARS = 1200; // ~300 tokens
const OVERLAP_CHARS = 200; // overlap for context

export function chunkFile(file: FileData): Chunk[] {
  if (file.path.includes("auth") || file.path.includes("core")) {
    MAX_CHARS = 800;
  }
  const lines = file.content.split("\n");

  const chunks: Chunk[] = [];

  let currentChunk: string[] = [];
  let currentLength = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1;

    // If adding this line exceeds limit → finalize chunk
    if (currentLength + lineLength > MAX_CHARS) {
      const chunkText = currentChunk.join("\n");

      if (chunkText.length > 1500) {
        // 🔥 split oversized chunk again
        const subChunks = splitLargeChunk(chunkText, file.path, startLine);
        chunks.push(...subChunks);
      } else {
        chunks.push({
          file: file.path,
          content: chunkText,
          startLine,
          endLine: i - 1,
          summaryHint: inferHint(file.path),
        });
      }

      const overlapText = chunkText.slice(-OVERLAP_CHARS);
      const overlapLines = overlapText.split("\n");

      currentChunk = [...overlapLines];
      currentLength = overlapText.length;
      startLine = i - overlapLines.length;
    }

    currentChunk.push(line);
    currentLength += lineLength;
  }

  // Push final chunk
  if (currentChunk.length > 0) {
    file.path = normalizePath(file.path);
    chunks.push({
      file: file.path,
      content: currentChunk.join("\n"),
      startLine,
      endLine: lines.length - 1,
      summaryHint: inferHint(file.path),
    });
  }

  return chunks;
}

export function chunkFiles(files: FileData[]): Chunk[] {
  return files.flatMap(chunkFile);
}

function normalizePath(fullPath: string): string {
  const parts = fullPath.split("/");

  // Remove temp + repo wrapper folder
  const repoIndex = parts.findIndex((p) => p.includes("repo-"));

  return parts.slice(repoIndex + 2).join("/");
}

function inferHint(filePath: string): string {
  if (filePath.includes("auth")) return "authentication logic";
  if (filePath.includes("api")) return "API handling";
  if (filePath.includes("db")) return "database logic";
  return "general code";
}

function splitLargeChunk(text: string, filePath: string, startLine: number) {
  const MAX = 1200;
  const parts: Chunk[] = [];

  for (let i = 0; i < text.length; i += MAX) {
    parts.push({
      file: filePath,
      content: text.slice(i, i + MAX),
      startLine,
      endLine: startLine,
      summaryHint: inferHint(filePath),
    });
  }

  return parts;
}
