/* eslint-disable @typescript-eslint/no-explicit-any */
export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
};

const isRateLimitError = (err: any) => {
  const status = err?.status || err?.statusCode || err?.response?.status;
  return status === 429 || /rate limit/i.test(err?.message || "");
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { attempts: 3, baseDelayMs: 1000 },
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const base = options.baseDelayMs ?? 1000;

  let lastErr;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      if (!isRateLimitError(err) || attempt === attempts - 1) {
        throw err;
      }

      const backoff = base * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * (backoff / 2));
      const delay = backoff + jitter;

      // eslint-disable-next-line no-console
      console.warn(`Request failed with rate limit, retrying in ${delay}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}
