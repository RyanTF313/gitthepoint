import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { AppError } from "@/lib/api/errors";

function assertSafeEntryPath(extractRoot: string, entryName: string): string {
  const normalized = entryName.replace(/\\/g, "/");

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    normalized.split("/").some((part) => part === "..")
  ) {
    throw new AppError(
      "Archive contains an unsafe path",
      400,
      "UNSAFE_ARCHIVE",
    );
  }

  const destination = path.resolve(extractRoot, normalized);
  const root = path.resolve(extractRoot);
  if (destination !== root && !destination.startsWith(root + path.sep)) {
    throw new AppError(
      "Archive contains an unsafe path",
      400,
      "UNSAFE_ARCHIVE",
    );
  }

  return destination;
}

export function extractZip(zipPath: string, id: string) {
  const extractPath = path.join("/tmp", `repo-${id}`);

  fs.mkdirSync(extractPath, { recursive: true });

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  for (const entry of entries) {
    const destination = assertSafeEntryPath(extractPath, entry.entryName);

    if (entry.isDirectory) {
      fs.mkdirSync(destination, { recursive: true });
      continue;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, entry.getData());
  }

  return extractPath;
}
