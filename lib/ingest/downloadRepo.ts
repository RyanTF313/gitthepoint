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
    if (res.status === 404) {
      throw new Error("Repository not found. Please check the URL and try again.");
    } else if (res.status === 403) {
      throw new Error("Access denied. The repository may be private or you may have hit a rate limit.");
    }

    throw new Error("Failed to download repo");
  }

  const buffer = await res.arrayBuffer();

  const filePath = path.join("/tmp", `${id}.zip`);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  return filePath;
}