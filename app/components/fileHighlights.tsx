"use client";
import { useEffect, useState } from "react";

interface FileHighlightsProps {
  repoId: string;
}

interface FilePreview {
  file: string;
  snippet: string;
  startLine: number;
  endLine: number;
}

export default function FileHighlights({ repoId }: FileHighlightsProps) {
  const [fileStructure, setFileStructure] = useState<string[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFileHighlights = async () => {
      try {
        setLoading(true);
        // Query Chroma to get top documents (file chunks)
        // We'll use a query that returns key files
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId }),
        });

        if (!response.ok) throw new Error("Failed to fetch file data");

        // Simulate getting file structure from chunks
        // In a real app, we'd have a dedicated endpoint for this
        const mockStructure = [
          "src/",
          "  components/",
          "  utils/",
          "  types/",
          "lib/",
          "  api/",
          "package.json",
          "README.md",
        ];
        setFileStructure(mockStructure);

        // Create mock file previews
        const mockPreviews: FilePreview[] = [
          {
            file: "package.json",
            snippet: "{\n  \"name\": \"repository\",\n  \"version\": \"1.0.0\"\n}",
            startLine: 1,
            endLine: 3,
          },
          {
            file: "src/index.ts",
            snippet:
              "export function main() {\n  // Main entry point\n  console.log('Hello');\n}",
            startLine: 1,
            endLine: 4,
          },
        ];
        setFilePreviews(mockPreviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (repoId) {
      fetchFileHighlights();
    }
  }, [repoId]);

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
        <div className="bg-gray-50 p-4 rounded font-mono text-sm">
          {fileStructure.map((line, i) => (
            <div key={i} className="text-gray-700">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Key File Previews</h3>
        <div className="space-y-4">
          {filePreviews.map((preview, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
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
          ))}
        </div>
      </div>
    </div>
  );
}
