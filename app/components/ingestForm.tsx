"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IngestForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

      if (!response.ok) throw new Error("Failed to ingest repository");
      const data = await response.json();
      const repoId = data.result.id;

      // Redirect to results page
      router.push(`/results/${repoId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}
