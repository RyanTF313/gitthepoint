export type IngestResult = {
  id: string;
  accessToken: string;
  chunkCount: number;
  expiresInMs: number;
};

export type ProgressRecord = {
  id: string;
  stage: string;
  percent?: number;
  message?: string;
  complete?: boolean;
  error?: string;
  result?: IngestResult;
  updatedAt: number;
};

const store = new Map<string, ProgressRecord>();
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function purgeOld() {
  const now = Date.now();
  for (const [id, record] of store) {
    if (now - record.updatedAt > MAX_AGE_MS) {
      store.delete(id);
    }
  }
}

export function initProgress(id: string, message = "starting") {
  purgeOld();
  const rec: ProgressRecord = {
    id,
    stage: "start",
    percent: 0,
    message,
    complete: false,
    updatedAt: Date.now(),
  };
  store.set(id, rec);
  return rec;
}

export function setProgress(id: string, props: Partial<ProgressRecord>) {
  const existing =
    store.get(id) ||
    ({ id, stage: "unknown", updatedAt: Date.now() } as ProgressRecord);
  const updated = { ...existing, ...props, updatedAt: Date.now() };
  store.set(id, updated);
  return updated;
}

export function completeProgress(
  id: string,
  message = "complete",
  result?: IngestResult,
) {
  return setProgress(id, {
    percent: 100,
    complete: true,
    message,
    stage: "done",
    result,
    error: undefined,
  });
}

export function failProgress(id: string, message: string) {
  return setProgress(id, {
    complete: true,
    stage: "error",
    message,
    error: message,
  });
}

export function getProgress(id: string) {
  purgeOld();
  return store.get(id) || null;
}

export function clearProgress(id: string) {
  store.delete(id);
}
