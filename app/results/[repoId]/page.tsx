import { Suspense } from "react";
import ArchitectureSummary from "@/app/components/architectureSummary";
import FileHighlights from "@/app/components/fileHighlights";
import ConversationalChat from "@/app/components/conversationalChat";
import Link from "next/link";

export const metadata = {
  title: "Repository Analysis",
  description: "View repository analysis results",
};

interface ResultsPageProps {
  params: Promise<{
    repoId: string;
  }>;
}

// Make the component async
export default async function ResultsPage({ params }: ResultsPageProps) {
  // Await the params Promise
  const { repoId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
            <p className="text-sm text-gray-600 mt-1">
              Repository ID: <code className="bg-gray-100 px-2 py-1 rounded">{repoId}</code>
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ← Analyze Another
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Summary + File Highlights */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense
              fallback={
                <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              }
            >
              <ArchitectureSummary repoId={repoId} />
            </Suspense>

            <Suspense
              fallback={
                <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              }
            >
              <FileHighlights repoId={repoId} />
            </Suspense>
          </div>

          {/* Right Column: Chat */}
          <div className="lg:col-span-1">
            <Suspense
              fallback={
                <div className="h-96 bg-white rounded-lg shadow-md animate-pulse">
                  <div className="bg-gray-200 h-20"></div>
                </div>
              }
            >
              <div className="sticky top-24 h-96">
                <ConversationalChat repoId={repoId} />
              </div>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}