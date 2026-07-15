import { downloadRepoZip } from "./downloadRepo";
import { extractZip } from "./extractZip";
import {
  buildFileStructure,
  getAllFiles,
  pickFilePreviews,
  readFiles,
} from "./filterFiles";
import { cleanupPaths } from "./cleanup";
import { v4 as uuidv4 } from "uuid";
import { parseGitHubRepoUrl } from "@/lib/api/validate";
import { initProgress, setProgress } from "@/lib/progress/progress";

export async function ingestRepo(repoUrl: string, id?: string) {
  const repoId = id || uuidv4();
  const { url } = parseGitHubRepoUrl(repoUrl);

  initProgress(repoId, "downloading repository");

  let zipPath: string | undefined;
  let extractPath: string | undefined;

  try {
    zipPath = await downloadRepoZip(url, repoId);
    setProgress(repoId, {
      stage: "downloaded",
      percent: 10,
      message: "downloaded zip",
    });

    extractPath = extractZip(zipPath, repoId);
    setProgress(repoId, {
      stage: "extracted",
      percent: 20,
      message: "extracted zip",
    });

    const paths = await getAllFiles(extractPath);
    setProgress(repoId, {
      stage: "discovered_files",
      percent: 30,
      message: `found ${paths.length} files`,
    });

    const fileContents = await readFiles(paths);
    setProgress(repoId, {
      stage: "read_files",
      percent: 40,
      message: "read file contents",
    });

    const structure = buildFileStructure(fileContents, extractPath);
    const previews = pickFilePreviews(fileContents, extractPath);

    return {
      id: repoId,
      repoUrl: url,
      files: fileContents,
      structure,
      previews,
    };
  } finally {
    cleanupPaths(zipPath, extractPath);
  }
}
