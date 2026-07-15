import fs from "fs";
import path from "path";
import { config } from "@/lib/config";
import { AppError } from "@/lib/api/errors";
import { parseGitHubRepoUrl } from "@/lib/api/validate";

async function resolveDefaultBranch(
  owner: string,
  repo: string,
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git-the-point",
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (res.ok) {
      const data = (await res.json()) as { default_branch?: string };
      if (data.default_branch) return data.default_branch;
    }
  } catch (err) {
    console.error("Failed to resolve default branch:", err);
  }

  return "main";
}

async function downloadZipToFile(
  zipUrl: string,
  filePath: string,
): Promise<Response> {
  const res = await fetch(zipUrl, {
    headers: { "User-Agent": "git-the-point" },
    redirect: "follow",
  });

  if (!res.ok || !res.body) {
    return res;
  }

  const contentLength = res.headers.get("content-length");
  if (contentLength && Number(contentLength) > config.maxZipBytes) {
    throw new AppError(
      `Repository archive exceeds ${Math.floor(config.maxZipBytes / (1024 * 1024))}MB limit`,
      413,
      "REPO_TOO_LARGE",
    );
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > config.maxZipBytes) {
      throw new AppError(
        `Repository archive exceeds ${Math.floor(config.maxZipBytes / (1024 * 1024))}MB limit`,
        413,
        "REPO_TOO_LARGE",
      );
    }
    chunks.push(value);
  }

  fs.writeFileSync(filePath, Buffer.concat(chunks));
  return res;
}

export async function downloadRepoZip(repoUrl: string, id: string) {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);
  const defaultBranch = await resolveDefaultBranch(owner, repo);
  const branches = Array.from(new Set([defaultBranch, "main", "master"]));

  const filePath = path.join("/tmp", `${id}.zip`);
  let lastStatus = 0;

  for (const branch of branches) {
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${encodeURIComponent(branch)}.zip`;

    try {
      const res = await downloadZipToFile(zipUrl, filePath);
      if (res.ok) {
        return filePath;
      }

      lastStatus = res.status;

      if (res.status === 404) {
        continue;
      }

      if (res.status === 403) {
        throw new AppError(
          "Access denied. The repository may be private or rate-limited.",
          403,
          "GITHUB_FORBIDDEN",
        );
      }

      throw new AppError("Failed to download repository", 502, "DOWNLOAD_FAILED");
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to download repository", 502, "DOWNLOAD_FAILED");
    }
  }

  if (lastStatus === 404) {
    throw new AppError(
      "Repository not found. Check the URL and that the default branch exists.",
      404,
      "REPO_NOT_FOUND",
    );
  }

  throw new AppError("Failed to download repository", 502, "DOWNLOAD_FAILED");
}
