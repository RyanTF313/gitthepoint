import fs from "fs/promises";
import path from "path";

const IGNORE_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
];

const ALLOWED_EXT = [
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".java",
  ".go",
  ".rb",
  ".md",
  ".json",
  ".html",
  ".css",
];

export async function getAllFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      const nested = await getAllFiles(filePath);
      results.push(...nested);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXT.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

export async function readFiles(filePaths: string[]) {
  const results: Array<{ path: string; content: string }> = [];
  const CONCURRENCY = 50;

  for (let i = 0; i < filePaths.length; i += CONCURRENCY) {
    const chunk = filePaths.slice(i, i + CONCURRENCY);
    const batch = await Promise.all(
      chunk.map(async (file) => ({
        path: file,
        content: await fs.readFile(file, "utf-8"),
      })),
    );

    results.push(...batch);
  }

  return results;
}