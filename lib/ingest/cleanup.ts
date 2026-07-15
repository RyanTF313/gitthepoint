import fs from "fs";

export function cleanupPaths(...paths: Array<string | undefined | null>) {
  for (const target of paths) {
    if (!target) continue;
    try {
      fs.rmSync(target, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to cleanup path:", target, err);
    }
  }
}
