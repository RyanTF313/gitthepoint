import fs from "fs/promises";
import path from "path";
import { config } from "@/lib/config";
import { AppError } from "@/lib/api/errors";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  ".venv",
  "venv",
  "__pycache__",
]);

const ALLOWED_EXT = new Set([
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
]);

const SECRET_NAME_RE =
  /(^|\/)(\.env($|\.)|.*credentials.*|.*secrets.*|.*\.pem$|.*\.key$|id_rsa|id_ed25519)/i;

export async function getAllFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  const walk = async (current: string) => {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const filePath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        await walk(filePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) continue;
      if (SECRET_NAME_RE.test(filePath)) continue;

      try {
        const stat = await fs.stat(filePath);
        if (stat.size > config.maxFileBytes) continue;
      } catch {
        continue;
      }

      results.push(filePath);
      if (results.length > config.maxFiles) {
        throw new AppError(
          `Repository exceeds the ${config.maxFiles} indexed-file limit`,
          413,
          "TOO_MANY_FILES",
        );
      }
    }
  };

  await walk(dir);
  return results;
}

export async function readFiles(filePaths: string[]) {
  const files: Array<{ path: string; content: string }> = [];
  let totalChars = 0;
  const CONCURRENCY = 50;

  for (let i = 0; i < filePaths.length; i += CONCURRENCY) {
    const chunk = filePaths.slice(i, i + CONCURRENCY);
    const batch = await Promise.all(
      chunk.map(async (file) => {
        try {
          const content = await fs.readFile(file, "utf-8");
          return { path: file, content };
        } catch {
          return null;
        }
      }),
    );

    for (const item of batch) {
      if (!item) continue;
      if (item.content.includes("\u0000")) continue;

      totalChars += item.content.length;
      if (totalChars > config.maxTotalChars) {
        throw new AppError(
          "Repository content exceeds the indexing size limit",
          413,
          "REPO_TOO_LARGE",
        );
      }

      files.push(item);
    }
  }

  return files;
}

export function buildFileStructure(
  files: Array<{ path: string }>,
  extractRoot: string,
): string[] {
  const relative = files
    .map((f) => normalizeRepoPath(f.path, extractRoot))
    .filter(Boolean)
    .sort();

  const dirs = new Set<string>();
  for (const file of relative) {
    const parts = file.split("/");
    let acc = "";
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i];
      dirs.add(acc + "/");
    }
  }

  return [...dirs, ...relative].sort((a, b) => a.localeCompare(b)).slice(0, 200);
}

export function pickFilePreviews(
  files: Array<{ path: string; content: string }>,
  extractRoot: string,
) {
  const scored = files
    .map((file) => {
      const rel = normalizeRepoPath(file.path, extractRoot);
      let score = 0;
      if (/package\.json$/i.test(rel)) score += 100;
      if (/readme/i.test(rel)) score += 90;
      if (/src\/index\.(ts|js|tsx|jsx)$/i.test(rel)) score += 80;
      if (/app\.(ts|js|tsx|jsx)$/i.test(rel)) score += 70;
      if (/main\.(ts|js|tsx|jsx|py|go)$/i.test(rel)) score += 60;
      return { ...file, rel, score };
    })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((file) => {
    const lines = file.content.split("\n");
    const snippetLines = lines.slice(0, 20);
    return {
      file: file.rel,
      snippet: snippetLines.join("\n").slice(0, 1200),
      startLine: 1,
      endLine: snippetLines.length,
    };
  });
}

export function normalizeRepoPath(
  fullPath: string,
  extractRoot?: string,
): string {
  const parts = fullPath.replace(/\\/g, "/").split("/");
  const repoIndex = parts.findIndex((p) => p.includes("repo-"));
  if (repoIndex >= 0) {
    return parts.slice(repoIndex + 2).join("/");
  }

  if (extractRoot) {
    const root = extractRoot.replace(/\\/g, "/").replace(/\/$/, "");
    const normalized = fullPath.replace(/\\/g, "/");
    if (normalized.startsWith(root + "/")) {
      const rest = normalized.slice(root.length + 1);
      const slash = rest.indexOf("/");
      return slash >= 0 ? rest.slice(slash + 1) : rest;
    }
  }

  return path.basename(fullPath);
}
