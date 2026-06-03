import { downloadRepoZip } from "./downloadRepo";
import { extractZip } from "./extractZip";
import { getAllFiles } from "./filterFiles";
import { readFiles } from "./filterFiles";
import { v4 as uuidv4 } from "uuid";
import { initProgress, setProgress } from "@/lib/progress/progress";

export async function ingestRepo(repoUrl: string, id?: string) {
  const repoId = id || uuidv4();

  initProgress(repoId, "downloading repository");

  const zipPath = await downloadRepoZip(repoUrl, repoId);
  setProgress(repoId, { stage: "downloaded", percent: 10, message: "downloaded zip" });

  const extractPath = extractZip(zipPath, repoId);
  setProgress(repoId, { stage: "extracted", percent: 20, message: "extracted zip" });

  const files = await getAllFiles(extractPath);
  setProgress(repoId, { stage: "discovered_files", percent: 30, message: `found ${files.length} files` });

  const fileContents = await readFiles(files);
  setProgress(repoId, { stage: "read_files", percent: 40, message: "read file contents" });

  return {
    id: repoId,
    files: fileContents,
  };
}