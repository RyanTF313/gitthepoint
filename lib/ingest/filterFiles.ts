import fs from "fs";
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

export function getAllFiles(dir: string): string[] {
  let results: string[] = [];

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(file)) continue;

      results = results.concat(getAllFiles(filePath));
    } else {
      const ext = path.extname(file);

      if (ALLOWED_EXT.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

export function readFiles(filePaths: string[]) {
  return filePaths.map((file) => {
    const content = fs.readFileSync(file, "utf-8");

    return {
      path: file,
      content,
    };
  });
}