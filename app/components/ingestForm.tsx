"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function IngestForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
    const [progressState, setProgressState] = useState<{ percent: number; message: string; stage?: string }>({ percent: 0, message: "" });
  const pollRef = useRef<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) throw new Error("Failed to start ingestion");
      const data = await response.json();
      const repoId = data.result.id;

      // start polling status
      pollRef.current = repoId;
      setProgressState({ percent: 0, message: "Queued", stage: "queued" });
      const interval = setInterval(async () => {
        try {
          const s = await fetch(`/api/ingest/status/${repoId}`);
          if (!s.ok) return;
          const jd = await s.json();
          const p = jd.progress;
          setProgressState({ percent: p.percent ?? 0, message: p.message ?? p.stage, stage: p.stage });
          if (p.complete) {
            clearInterval(interval);
            router.push(`/results/${repoId}`);
          }
        } catch (e) {
          console.log("Status polling error:", e);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // cleanup if component unmounts
      pollRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
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
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${progressState.percent}%`, transition: "width 300ms" }}
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
