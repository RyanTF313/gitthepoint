import { AppError } from "@/lib/api/errors";

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = "Rate limit exceeded. Please try again later.",
) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  prune(bucket, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    throw new AppError(message, 429, "RATE_LIMITED");
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
