import { AppError } from "@/lib/api/errors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireString(
  value: unknown,
  field: string,
  maxLen = 2000,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} is required`, 400, "VALIDATION_ERROR");
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw new AppError(`${field} is too long`, 400, "VALIDATION_ERROR");
  }
  return trimmed;
}

export function parseGitHubRepoUrl(raw: string): {
  owner: string;
  repo: string;
  url: string;
} {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new AppError(
      "Invalid GitHub URL. Use https://github.com/owner/repo",
      400,
      "INVALID_URL",
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError("Invalid GitHub URL protocol", 400, "INVALID_URL");
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new AppError(
      "Only github.com repositories are supported",
      400,
      "INVALID_URL",
    );
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new AppError(
      "Invalid GitHub URL. Use https://github.com/owner/repo",
      400,
      "INVALID_URL",
    );
  }

  const owner = parts[0];
  let repo = parts[1].replace(/\.git$/i, "");
  repo = repo.split("?")[0]?.split("#")[0] ?? repo;

  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    throw new AppError("Invalid GitHub owner or repository name", 400, "INVALID_URL");
  }

  return {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`,
  };
}

export function requireRepoId(value: unknown): string {
  const repoId = requireString(value, "repoId", 64);
  if (!UUID_RE.test(repoId)) {
    throw new AppError("Invalid repoId", 400, "VALIDATION_ERROR");
  }
  return repoId;
}
