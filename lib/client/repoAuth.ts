const storageKey = (repoId: string) => `gtp:repoToken:${repoId}`;

export function saveRepoAccessToken(repoId: string, accessToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(repoId), accessToken);
}

export function getRepoAccessToken(repoId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(storageKey(repoId));
}

export function clearRepoAccessToken(repoId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(repoId));
}
