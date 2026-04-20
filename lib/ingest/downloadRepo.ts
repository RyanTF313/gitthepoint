import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export async function downloadRepoZip(repoUrl: string, id: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  const [, owner, repo] = match;

  const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;

  const res = await fetch(zipUrl);

  if (!res.ok) {
    throw new Error("Failed to download repo");
  }

  const buffer = await res.arrayBuffer();

  const filePath = path.join("/tmp", `${id}.zip`);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  return filePath;
}