import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";

export function extractZip(zipPath: string, id: string) {
  const extractPath = path.join("/tmp", `repo-${id}`);

  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractPath, true);

  return extractPath;
}