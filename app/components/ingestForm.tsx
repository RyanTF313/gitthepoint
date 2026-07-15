"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRepoAccessToken } from "@/lib/client/repoAuth";

type ProgressState = {
  percent: number;
  message: string;
  stage?: string;
};

export default function IngestForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressState, setProgressState] = useState<ProgressState>({
    percent: 0,
    message: "",
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setProgressState({ percent: 0, message: "Starting…", stage: "queued" });

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start ingestion");
      }

      const jobId = data.jobId || data.result?.id;
      if (!jobId) {
        throw new Error("Missing job id from ingest response");
      }

      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/ingest/status/${jobId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.error || "Failed to check ingest status");
          }

          const progress = statusData.progress;
          setProgressState({
            percent: progress?.percent ?? 0,
            message: progress?.message ?? progress?.stage ?? "Working…",
            stage: progress?.stage,
          });

          if (progress?.error || statusData.error) {
            if (pollRef.current) clearInterval(pollRef.current);
            setLoading(false);
            setError(progress?.error || statusData.error || "Ingest failed");
            return;
          }

          if (progress?.complete && statusData.result?.accessToken) {
            if (pollRef.current) clearInterval(pollRef.current);
            const result = statusData.result;
            saveRepoAccessToken(result.id, result.accessToken);
            router.push(
              `/results/${result.id}?token=${encodeURIComponent(result.accessToken)}`,
            );
          }
        } catch (err) {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoading(false);
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
      >
        <label htmlFor="repoUrl" className="block text-sm font-medium mb-2">
          GitHub Repository URL
        </label>
        <input
          id="repoUrl"
          type="url"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Analyzing Repository..." : "Analyze Repo"}
        </button>
        {loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-[width] duration-300"
                style={{ width: `${progressState.percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-700">{progressState.message}</p>
          </div>
        )}
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}
