import { FileData, Chunk } from "@/app/types";
import { normalizeRepoPath } from "@/lib/ingest/filterFiles";

const DEFAULT_MAX_CHARS = 1200; // ~300 tokens
const AUTH_CORE_MAX_CHARS = 800;
const OVERLAP_CHARS = 200;

export function chunkFile(file: FileData): Chunk[] {
  const maxChars =
    file.path.includes("auth") || file.path.includes("core")
      ? AUTH_CORE_MAX_CHARS
      : DEFAULT_MAX_CHARS;

  const normalizedPath = normalizeRepoPath(file.path);
  const lines = file.content.split("\n");
  const chunks: Chunk[] = [];

  let currentChunk: string[] = [];
  let currentLength = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1;

    if (currentLength + lineLength > maxChars && currentChunk.length > 0) {
      const chunkText = currentChunk.join("\n");

      if (chunkText.length > 1500) {
        chunks.push(
          ...splitLargeChunk(chunkText, normalizedPath, startLine),
        );
      } else {
        chunks.push({
          file: normalizedPath,
          content: chunkText,
          startLine,
          endLine: i - 1,
          summaryHint: inferHint(normalizedPath),
        });
      }

      const overlapText = chunkText.slice(-OVERLAP_CHARS);
      const overlapLines = overlapText.split("\n");

      currentChunk = [...overlapLines];
      currentLength = overlapText.length;
      startLine = Math.max(0, i - overlapLines.length);
    }

    currentChunk.push(line);
    currentLength += lineLength;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      file: normalizedPath,
      content: currentChunk.join("\n"),
      startLine,
      endLine: lines.length - 1,
      summaryHint: inferHint(normalizedPath),
    });
  }

  return chunks;
}

export function chunkFiles(files: FileData[]): Chunk[] {
  return files.flatMap(chunkFile);
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
