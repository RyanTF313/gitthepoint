"use client";
import { useEffect, useState } from "react";
import {
  getRepoAccessToken,
  saveRepoAccessToken,
} from "@/lib/client/repoAuth";

interface FileHighlightsProps {
  repoId: string;
  accessToken?: string;
}

interface FilePreview {
  file: string;
  snippet: string;
  startLine: number;
  endLine: number;
}

export default function FileHighlights({
  repoId,
  accessToken,
}: FileHighlightsProps) {
  const [fileStructure, setFileStructure] = useState<string[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = accessToken || getRepoAccessToken(repoId);
    if (accessToken) {
      saveRepoAccessToken(repoId, accessToken);
    }

    const fetchFileHighlights = async () => {
      if (!token) {
        setError("Missing access token. Re-analyze the repository.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId, accessToken: token }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch file data");
        }

        setFileStructure(data.structure || []);
        setFilePreviews(data.previews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (repoId) {
      fetchFileHighlights();
    }
  }, [repoId, accessToken]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">File Highlights</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-red-500">
        <h2 className="text-2xl font-bold mb-4">File Highlights</h2>
        <p className="text-red-600">Error loading files: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">File Highlights</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Repository Structure</h3>
        <div className="bg-gray-50 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {fileStructure.length === 0 ? (
            <div className="text-gray-500">No indexed files available.</div>
          ) : (
            fileStructure.map((line) => (
              <div key={line} className="text-gray-700">
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Key File Previews</h3>
        <div className="space-y-4">
          {filePreviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No key file previews found.</p>
          ) : (
            filePreviews.map((preview) => (
              <div key={preview.file} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    {preview.file}
                  </p>
                  <p className="text-xs text-gray-600">
                    Lines {preview.startLine}-{preview.endLine}
                  </p>
                </div>
                <pre className="bg-gray-50 p-4 overflow-x-auto text-sm">
                  <code className="text-gray-800">{preview.snippet}</code>
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
