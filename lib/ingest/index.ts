import { downloadRepoZip } from "./downloadRepo";
import { extractZip } from "./extractZip";
import { getAllFiles } from "./filterFiles";
import { readFiles } from "./filterFiles";
import { v4 as uuidv4 } from "uuid";

export async function ingestRepo(repoUrl: string) {
  const id = uuidv4();

  const zipPath = await downloadRepoZip(repoUrl, id);
  const extractPath = extractZip(zipPath, id);

  const files = getAllFiles(extractPath);
  const fileContents = readFiles(files);

  return {
    id,
    files: fileContents,
  };
}