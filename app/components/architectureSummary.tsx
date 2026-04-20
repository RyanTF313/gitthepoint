"use client";
import { useEffect, useState } from "react";

interface ArchitectureSummaryProps {
  repoId: string;
}

export default function ArchitectureSummary({ repoId }: ArchitectureSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId }),
        });

        if (!response.ok) throw new Error("Failed to fetch summary");
        const data = await response.json();
        setSummary(data.summary || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (repoId) {
      fetchSummary();
    }
  }, [repoId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Architecture Summary</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-red-500">
        <h2 className="text-2xl font-bold mb-4">Architecture Summary</h2>
        <p className="text-red-600">Error loading summary: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Architecture Summary</h2>
      <div className="prose prose-sm max-w-none">
        {summary.split("\n").map((line, i) => {
          if (line.startsWith("##")) {
            return (
              <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
                {line.replace(/^#+\s/, "")}
              </h3>
            );
          }
          if (line.trim() === "") {
            return null;
          }
          if (line.startsWith("-")) {
            return (
              <li key={i} className="ml-4 text-gray-700">
                {line.replace(/^-\s/, "")}
              </li>
            );
          }
          return (
            <p key={i} className="text-gray-700 mb-2">
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
