type ProgressRecord = {
  id: string;
  stage: string;
  percent?: number;
  message?: string;
  complete?: boolean;
  updatedAt: number;
};

const store = new Map<string, ProgressRecord>();

export function initProgress(id: string, message = "starting") {
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
  const existing = store.get(id) || { id, stage: "unknown", updatedAt: Date.now() } as ProgressRecord;
  const updated = { ...existing, ...props, updatedAt: Date.now() };
  store.set(id, updated);
  return updated;
}

export function completeProgress(id: string, message = "complete") {
  return setProgress(id, { percent: 100, complete: true, message, stage: "done" });
}

export function getProgress(id: string) {
  return store.get(id) || null;
}

export function clearProgress(id: string) {
  store.delete(id);
}
